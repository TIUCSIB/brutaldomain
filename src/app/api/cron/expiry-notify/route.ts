import { NextResponse } from "next/server";

import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import {
  isCronAuthorized,
  readCronSecret,
  readDefaultNotifyEmail,
  readDefaultTelegramChatId,
} from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { runExpiryNotify } from "@/lib/notify/run-expiry-notify";

export const dynamic = "force-dynamic";

function parseWindowDays(request: Request): number {
  const raw = new URL(request.url).searchParams.get("windowDays");
  const n = raw ? Number(raw) : Number(process.env.NOTIFY_WINDOW_DAYS ?? 30);
  if (!Number.isFinite(n)) return 30;
  return Math.min(365, Math.max(1, Math.floor(n)));
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
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const email = readDefaultNotifyEmail();
  const telegramChatId = readDefaultTelegramChatId();
  const channelEmail = Boolean(email);
  const channelTelegram = Boolean(telegramChatId);

  if (!channelEmail && !channelTelegram) {
    return NextResponse.json(
      {
        message:
          "Set NOTIFY_EMAIL and/or TELEGRAM_CHAT_ID for cron delivery targets",
      },
      { status: 400 },
    );
  }

  const dryRun =
    new URL(request.url).searchParams.get("dryRun") === "1" ||
    new URL(request.url).searchParams.get("dryRun") === "true";

  try {
    const result = await runExpiryNotify({
      windowDays: parseWindowDays(request),
      includeExpired: true,
      email,
      telegramChatId,
      channelEmail,
      channelTelegram,
      dryRun,
      forceTestMessage: false,
      title: "BrutalDomain 到期提醒",
    });

    const failed = result.channels.filter((item) => !item.ok);
    return NextResponse.json(
      {
        ok: failed.length === 0,
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
