import "server-only";

import { readTelegramBotToken } from "@/lib/env/notify-env";

export interface TelegramSendResult {
  ok: boolean;
  skipped?: boolean;
  message?: string;
  messageId?: number;
}

export async function sendTelegramMessage(input: {
  chatId: string;
  text: string;
  dryRun?: boolean;
}): Promise<TelegramSendResult> {
  const chatId = input.chatId.trim();
  if (!chatId) {
    return { ok: false, message: "缺少 Telegram Chat ID" };
  }

  const token = readTelegramBotToken();
  if (!token) {
    return {
      ok: false,
      message: "服务端未配置 TELEGRAM_BOT_TOKEN",
    };
  }

  if (input.dryRun) {
    return {
      ok: true,
      skipped: true,
      message: `dry-run：将发送到 Chat ${chatId}（${input.text.length} 字）`,
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: input.text,
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  } | null;

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      message:
        payload?.description ||
        `Telegram API 失败（HTTP ${response.status}）`,
    };
  }

  return {
    ok: true,
    messageId: payload.result?.message_id,
    message: "Telegram 已发送",
  };
}
