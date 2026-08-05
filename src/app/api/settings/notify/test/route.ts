import { NextResponse } from "next/server";

import {
  isValidNotifyEmail,
  normalizeServerNotifyPrefs,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { readServerNotifyPrefs } from "@/lib/notify/prefs-store";
import { runExpiryNotify } from "@/lib/notify/run-expiry-notify";

export const dynamic = "force-dynamic";

interface TestBody {
  /** When true, use current form draft instead of saved server prefs. */
  useDraft?: boolean;
  draft?: Partial<ServerNotifyPrefs>;
  dryRun?: boolean;
  forceTestMessage?: boolean;
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

  const saved = await readServerNotifyPrefs();
  const prefs = body.useDraft
    ? normalizeServerNotifyPrefs({ ...saved, ...(body.draft ?? {}) })
    : saved;

  if (!prefs.channelEmail && !prefs.channelTelegram) {
    return NextResponse.json(
      { message: "请至少启用 Email 或 Telegram 渠道（设置页保存或草稿）" },
      { status: 400 },
    );
  }

  if (prefs.channelEmail && !isValidNotifyEmail(prefs.email)) {
    return NextResponse.json(
      { message: "测试邮件需要有效邮箱地址" },
      { status: 400 },
    );
  }

  if (prefs.channelTelegram && !prefs.telegramChatId.trim()) {
    return NextResponse.json(
      { message: "测试 Telegram 需要 Chat ID" },
      { status: 400 },
    );
  }

  try {
    const result = await runExpiryNotify({
      windowDays: prefs.notifyDays,
      includeExpired: prefs.notifyExpired,
      email: prefs.email,
      telegramChatId: prefs.telegramChatId,
      channelEmail: prefs.channelEmail,
      channelTelegram: prefs.channelTelegram,
      dryRun: Boolean(body.dryRun),
      forceTestMessage: body.forceTestMessage !== false,
      title: "BrutalDomain 通知测试",
    });

    const failed = result.channels.filter((item) => !item.ok);
    return NextResponse.json(
      {
        ok: failed.length === 0,
        source: body.useDraft ? "draft" : "server",
        prefs: {
          notifyDays: prefs.notifyDays,
          email: prefs.email,
          telegramChatId: prefs.telegramChatId,
          channelEmail: prefs.channelEmail,
          channelTelegram: prefs.channelTelegram,
        },
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
