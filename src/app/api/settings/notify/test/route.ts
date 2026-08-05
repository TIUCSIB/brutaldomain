import { NextResponse } from "next/server";

import { isValidEmail } from "@/features/settings/automation-prefs";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { runExpiryNotify } from "@/lib/notify/run-expiry-notify";

export const dynamic = "force-dynamic";

interface TestBody {
  windowDays?: number;
  includeExpired?: boolean;
  email?: string;
  telegramChatId?: string;
  channelEmail?: boolean;
  channelTelegram?: boolean;
  dryRun?: boolean;
  forceTestMessage?: boolean;
}

function clampWindowDays(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 30;
  return Math.min(365, Math.max(1, Math.floor(n)));
}

export async function POST(request: Request) {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  let body: TestBody = {};
  try {
    body = (await request.json()) as TestBody;
  } catch {
    body = {};
  }

  const channelEmail = Boolean(body.channelEmail);
  const channelTelegram = Boolean(body.channelTelegram);
  if (!channelEmail && !channelTelegram) {
    return NextResponse.json(
      { message: "请至少选择 Email 或 Telegram 渠道" },
      { status: 400 },
    );
  }

  if (channelEmail) {
    const email = body.email?.trim() ?? "";
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "测试邮件需要有效邮箱地址" },
        { status: 400 },
      );
    }
  }

  if (channelTelegram) {
    const chatId = body.telegramChatId?.trim() ?? "";
    if (!chatId) {
      return NextResponse.json(
        { message: "测试 Telegram 需要 Chat ID" },
        { status: 400 },
      );
    }
  }

  try {
    const result = await runExpiryNotify({
      windowDays: clampWindowDays(body.windowDays),
      includeExpired: body.includeExpired ?? true,
      email: body.email,
      telegramChatId: body.telegramChatId,
      channelEmail,
      channelTelegram,
      dryRun: Boolean(body.dryRun),
      forceTestMessage: body.forceTestMessage !== false,
      title: "BrutalDomain 通知测试",
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
          error instanceof Error ? error.message : "发送测试通知失败",
      },
      { status: 500 },
    );
  }
}
