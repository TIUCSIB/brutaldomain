import { NextResponse } from "next/server";

import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isCronAuthorized, readCronSecret } from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { readServerNotifyPrefs } from "@/lib/notify/prefs-store";
import { runExpiryNotify } from "@/lib/notify/run-expiry-notify";

export const dynamic = "force-dynamic";

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
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const prefs = await readServerNotifyPrefs();
  if (!prefs.notifyEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "服务端通知已关闭（设置页 notifyEnabled=false）",
      prefs: {
        notifyEnabled: false,
        notifyDays: prefs.notifyDays,
      },
    });
  }

  if (!prefs.channelEmail && !prefs.channelTelegram) {
    return NextResponse.json(
      {
        message:
          "未启用 Email/Telegram 渠道。请在设置 → 通知与续费 中配置并保存。",
      },
      { status: 400 },
    );
  }

  const dryRun =
    new URL(request.url).searchParams.get("dryRun") === "1" ||
    new URL(request.url).searchParams.get("dryRun") === "true";

  // Optional query override for one-off scans only
  const windowParam = new URL(request.url).searchParams.get("windowDays");
  const windowDays = windowParam
    ? Math.min(365, Math.max(1, Number(windowParam) || prefs.notifyDays))
    : prefs.notifyDays;

  try {
    const result = await runExpiryNotify({
      windowDays,
      includeExpired: prefs.notifyExpired,
      email: prefs.email,
      telegramChatId: prefs.telegramChatId,
      channelEmail: prefs.channelEmail,
      channelTelegram: prefs.channelTelegram,
      dryRun,
      forceTestMessage: false,
      title: "BrutalDomain 到期提醒",
    });

    const failed = result.channels.filter((item) => !item.ok);
    return NextResponse.json(
      {
        ok: failed.length === 0,
        source: "server-prefs",
        prefs: {
          notifyDays: windowDays,
          email: prefs.email,
          telegramChatId: prefs.telegramChatId,
          channelEmail: prefs.channelEmail,
          channelTelegram: prefs.channelTelegram,
          updatedAt: prefs.updatedAt,
        },
        ...result,
      },
      { status: failed.length === 0 ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Cron notify failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
