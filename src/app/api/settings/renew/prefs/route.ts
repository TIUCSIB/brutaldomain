import { NextResponse } from "next/server";

import {
  getNextAutoRenewRunAt,
  normalizeServerRenewPrefs,
  validateServerRenewPrefs,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuthenticatedMutation, requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { getNotifyEnvStatus, readCronSecret } from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import {
  getRenewStateBackend,
  isDurableRenewStorageReady,
  isRenewBlobConfigured,
  readRenewState,
  writeRenewState,
} from "@/lib/renew/renew-state-store";

export const dynamic = "force-dynamic";

function storageMeta() {
  return {
    backend: getRenewStateBackend(),
    blobConfigured: isRenewBlobConfigured(),
  };
}

function statusMeta(state: Awaited<ReturnType<typeof readRenewState>>) {
  const envStatus = getNotifyEnvStatus();
  return {
    dnsheConfigured: isDnsheConfigured(),
    cronSecretConfigured: Boolean(readCronSecret()),
    emailConfigured: envStatus.emailConfigured,
    telegramConfigured: envStatus.telegramConfigured,
    fromEmail: envStatus.fromEmail,
    lastRunAt: state.prefs.lastRunAt,
    nextRunAt: getNextAutoRenewRunAt(state.prefs.lastRunAt)?.toISOString() ?? null,
    history: [...state.history].reverse().slice(0, 10),
  };
}

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  const state = await readRenewState();
  return NextResponse.json({
    prefs: state.prefs,
    status: statusMeta(state),
    storage: storageMeta(),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:renew-prefs",
    limit: 10,
    message: "自动续费配置保存过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<Partial<ServerRenewPrefs>>(request);
  if (!parsed.ok) return parsed.response;

  const current = await readRenewState();
  const body = parsed.value;
  const nextPrefs = normalizeServerRenewPrefs({
    ...current.prefs,
    ...body,
    autoRenewDays: 180,
    lastRunAt: current.prefs.lastRunAt,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.session.username,
  });
  const errors = validateServerRenewPrefs(nextPrefs);
  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0], errors }, { status: 400 });
  }
  if (nextPrefs.autoRenewEnabled && !isDurableRenewStorageReady()) {
    return NextResponse.json(
      {
        message:
          "生产环境启用自动续费前需要先配置 BLOB_READ_WRITE_TOKEN。",
      },
      { status: 503 },
    );
  }
  const result = await writeRenewState({
    ...current,
    prefs: nextPrefs,
  });

  let warning: string | null = null;
  if (result.persistedToBlob) {
    warning = null;
  } else if (result.persistedToDisk) {
    warning = isRenewBlobConfigured()
      ? "Blob 写入失败，已回退到本地 .data/（仅当前机器有效）。"
      : "已写入本地 .data/。部署到 Vercel 请配置 BLOB_READ_WRITE_TOKEN。";
  } else {
    warning =
      "未能持久化（Blob/磁盘均失败），仅保存在当前进程内存，重启后可能丢失。";
  }

  return NextResponse.json({
    prefs: result.state.prefs,
    status: statusMeta(result.state),
    storage: storageMeta(),
    persisted: result.persisted,
    persistedToDisk: result.persistedToDisk,
    persistedToBlob: result.persistedToBlob,
    backend: result.backend,
    warning,
  });
}
