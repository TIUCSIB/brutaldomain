import { NextResponse } from "next/server";

import {
  normalizeServerRenewPrefs,
  validateRenewNotificationTargets,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import { readJsonBody } from "@/lib/api/json-body";
import { internalFailure, logServerError } from "@/lib/api/response";
import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { sendAutoRenewTestNotification } from "@/lib/renew/auto-renew-notify";
import { readRenewState } from "@/lib/renew/renew-state-store";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

interface TestNotifyBody {
  useDraft?: boolean;
  draft?: Partial<ServerRenewPrefs>;
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:test-notify",
    limit: 5,
    message: "测试通知发送过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<TestNotifyBody>(request);
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
  const errors = validateRenewNotificationTargets(prefs);
  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0], errors }, { status: 400 });
  }

  try {
    const channels = await sendAutoRenewTestNotification({
      renewPrefs: prefs,
    });
    const ok = channels.every((item) => item.ok);
    return NextResponse.json(
      {
        ok,
        source: body.useDraft ? "draft" : "server",
        channels,
        message: ok ? "测试通知已发送" : "部分测试通知发送失败",
      },
      { status: ok ? 200 : 502 },
    );
  } catch (error) {
    logServerError("settings:test-notify", error);
    return internalFailure("发送测试通知失败");
  }
}
