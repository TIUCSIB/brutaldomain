import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import {
  getNextAutoRenewRunAt,
  isAutoRenewDue,
} from "@/features/settings/server-renew-prefs";
import { internalFailure, logServerError } from "@/lib/api/response";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isCronAuthorized, readCronSecret } from "@/lib/env/notify-env";
import { getProductionAutoRenewConfigIssues, isDnsheConfigured } from "@/lib/env/server-env";
import {
  acquireAutoRenewLock,
  releaseAutoRenewLock,
} from "@/lib/renew/auto-renew-lock";
import { sendAutoRenewSummary } from "@/lib/renew/auto-renew-notify";
import { runAutoRenew } from "@/lib/renew/run-auto-renew";
import {
  AUTO_RENEW_LEASE_MS,
  isDurableRenewStorageReady,
  mergeRenewHistory,
  readRenewState,
  readRenewStateSnapshot,
  writeRenewState,
} from "@/lib/renew/renew-state-store";

export const dynamic = "force-dynamic";

async function releaseLease(runId: string) {
  const latest = await readRenewStateSnapshot({ fresh: true, blobOnly: true });
  if (latest.state.lease?.runId !== runId) return;

  await writeRenewState(
    {
      ...latest.state,
      lease: null,
    },
    {
      requireBlob: true,
      ifMatch: latest.etag,
    },
  );
}

async function handle(request: Request) {
  if (!readCronSecret()) {
    return NextResponse.json(
      { message: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun =
    url.searchParams.get("dryRun") === "1" ||
    url.searchParams.get("dryRun") === "true";
  const now = new Date();
  const productionIssues = getProductionAutoRenewConfigIssues();
  if (!dryRun && productionIssues.length > 0) {
    return NextResponse.json(
      {
        message: "Production auto-renew is not fully configured",
        issues: productionIssues,
      },
      { status: 503 },
    );
  }

  const useStrictBlobState = !dryRun && isDurableRenewStorageReady();
  const state = await readRenewState(
    useStrictBlobState ? { fresh: true, blobOnly: true } : undefined,
  );
  const { prefs } = state;

  if (!prefs.autoRenewEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "disabled",
      prefs: {
        autoRenewEnabled: false,
        autoRenewDays: prefs.autoRenewDays,
        lastRunAt: prefs.lastRunAt,
      },
    });
  }

  const nextRunAt = getNextAutoRenewRunAt(prefs.lastRunAt);

  if (!dryRun && !isDurableRenewStorageReady()) {
    return NextResponse.json(
      {
        message:
          "Production auto-renew requires BLOB_READ_WRITE_TOKEN for durable storage.",
      },
      { status: 503 },
    );
  }

  if (!dryRun && !isAutoRenewDue(prefs.lastRunAt, now)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not_due",
      lastRunAt: prefs.lastRunAt,
      nextRunAt: nextRunAt?.toISOString() ?? null,
    });
  }

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const runId = dryRun ? null : randomUUID();
  let lockAcquired = false;
  let leaseWritten = false;

  try {
    if (runId !== null) {
      lockAcquired = await acquireAutoRenewLock(runId, AUTO_RENEW_LEASE_MS);
      if (!lockAcquired) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "lease_active",
        });
      }
      leaseWritten = true;
    }

    const activeState =
      runId === null
        ? state
        : (await readRenewStateSnapshot({ fresh: true, blobOnly: true })).state;
    const result = await runAutoRenew({
      prefs,
      state: activeState,
      dryRun,
      now,
    });
    const failedCount = result.items.filter((item) => item.outcome === "failed").length;
    const unknownCount = result.items.filter((item) => item.outcome === "unknown").length;

    if (!dryRun) {
      const latest = await readRenewStateSnapshot({ fresh: true, blobOnly: true });
      if (latest.state.lease?.runId !== runId) {
        return internalFailure("自动续费执行状态已变化，请稍后查看结果");
      }

      const saved = await writeRenewState(
        {
          ...latest.state,
          lease: null,
          history: mergeRenewHistory(latest.state.history, result.items),
          prefs: {
            ...latest.state.prefs,
            lastRunAt: now.toISOString(),
          },
        },
        {
          requireBlob: true,
          ifMatch: latest.etag,
        },
      );

      if (!saved.persistedToBlob || saved.preconditionFailed) {
        return NextResponse.json(
          {
            message:
              "自动续费结果未能安全写入 Blob，已阻止后续通知，请稍后检查。",
          },
          { status: 503 },
        );
      }

      leaseWritten = false;
      const notifyPrefs = saved.state.prefs;
      const notifyChannels =
        notifyPrefs.notifyOnSuccess &&
        (notifyPrefs.channelEmail || notifyPrefs.channelTelegram)
          ? await sendAutoRenewSummary({
              renewPrefs: notifyPrefs,
              result,
            })
          : [];

      return NextResponse.json(
        {
          ok: failedCount === 0 && unknownCount === 0,
          prefs: {
            autoRenewDays: saved.state.prefs.autoRenewDays,
            notifyOnSuccess: saved.state.prefs.notifyOnSuccess,
            channelEmail: saved.state.prefs.channelEmail,
            channelTelegram: saved.state.prefs.channelTelegram,
            lastRunAt: saved.state.prefs.lastRunAt,
            nextRunAt:
              getNextAutoRenewRunAt(saved.state.prefs.lastRunAt)?.toISOString() ??
              null,
          },
          channels: notifyChannels,
          ...result,
        },
        { status: failedCount === 0 && unknownCount === 0 ? 200 : 502 },
      );
    }

    const notifyChannels =
      prefs.notifyOnSuccess && (prefs.channelEmail || prefs.channelTelegram)
        ? await sendAutoRenewSummary({
            renewPrefs: prefs,
            result,
            dryRun: true,
          })
        : [];

    return NextResponse.json({
      ok: failedCount === 0 && unknownCount === 0,
      dryRun: true,
      prefs: {
        autoRenewDays: prefs.autoRenewDays,
        notifyOnSuccess: prefs.notifyOnSuccess,
        channelEmail: prefs.channelEmail,
        channelTelegram: prefs.channelTelegram,
        lastRunAt: prefs.lastRunAt,
        nextRunAt: nextRunAt?.toISOString() ?? null,
      },
      channels: notifyChannels,
      ...result,
    });
  } catch (error) {
    logServerError("cron:auto-renew", error);
    return internalFailure("自动续费执行失败");
  } finally {
    if (runId) {
      if (leaseWritten) {
        await releaseLease(runId);
      }
      if (lockAcquired) {
        await releaseAutoRenewLock(runId);
      }
    }
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
