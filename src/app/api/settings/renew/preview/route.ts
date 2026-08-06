import { NextResponse } from "next/server";

import {
  normalizeServerRenewPrefs,
  validateServerRenewPrefs,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import { readJsonBody } from "@/lib/api/json-body";
import { internalFailure, logServerError } from "@/lib/api/response";
import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { readRenewState } from "@/lib/renew/renew-state-store";
import { runAutoRenew } from "@/lib/renew/run-auto-renew";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

interface PreviewBody {
  useDraft?: boolean;
  draft?: Partial<ServerRenewPrefs>;
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:renew-preview",
    limit: 10,
    message: "自动续费预检过于频繁，请稍后再试",
    windowMs: 5 * 60 * 1000,
  });
  if (limited) return limited;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const parsed = await readJsonBody<PreviewBody>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const state = await readRenewState();
  const prefs = body.useDraft
    ? normalizeServerRenewPrefs({
        ...state.prefs,
        ...(body.draft ?? {}),
        autoRenewDays: 180,
      })
    : state.prefs;
  const errors = validateServerRenewPrefs(prefs);
  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0], errors }, { status: 400 });
  }

  try {
    const result = await runAutoRenew({
      prefs,
      state,
      dryRun: true,
    });
    return NextResponse.json({
      ok: true,
      source: body.useDraft ? "draft" : "server",
      prefs: {
        autoRenewEnabled: prefs.autoRenewEnabled,
        autoRenewDays: prefs.autoRenewDays,
        autoRenewRegisteredOnly: prefs.autoRenewRegisteredOnly,
        notifyOnSuccess: prefs.notifyOnSuccess,
        channelEmail: prefs.channelEmail,
        channelTelegram: prefs.channelTelegram,
        email: prefs.email,
        telegramChatId: prefs.telegramChatId,
      },
      ...result,
    });
  } catch (error) {
    logServerError("settings:renew-preview", error);
    return internalFailure("自动续费预检失败");
  }
}
