import "server-only";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  readDefaultNotifyEmail,
  readDefaultTelegramChatId,
} from "@/lib/env/notify-env";
import { sendEmailMessage } from "@/lib/notify/email";
import {
  formatExpiryNotifyText,
  scanExpiryNotifyItems,
  type ExpiryNotifyItem,
} from "@/lib/notify/expiry-scan";
import { sendTelegramMessage } from "@/lib/notify/telegram";

export interface RunExpiryNotifyInput {
  windowDays: number;
  includeExpired?: boolean;
  email?: string | null;
  telegramChatId?: string | null;
  channelEmail?: boolean;
  channelTelegram?: boolean;
  dryRun?: boolean;
  /** When true, always send even if zero alerts (for connectivity test). */
  forceTestMessage?: boolean;
  title?: string;
}

export interface ChannelResult {
  channel: "email" | "telegram";
  ok: boolean;
  skipped?: boolean;
  message?: string;
}

export interface RunExpiryNotifyResult {
  scanned: number;
  alertCount: number;
  items: ExpiryNotifyItem[];
  text: string;
  channels: ChannelResult[];
}

export async function runExpiryNotify(
  input: RunExpiryNotifyInput,
): Promise<RunExpiryNotifyResult> {
  const repository = new DnsheDomainRepository();
  const list = await repository.listDomains();
  const items = scanExpiryNotifyItems(list.domains, {
    windowDays: input.windowDays,
    includeExpired: input.includeExpired ?? true,
  });

  const text = formatExpiryNotifyText({
    items,
    windowDays: input.windowDays,
    title: input.title,
  });

  const shouldSend =
    input.forceTestMessage || items.length > 0 || Boolean(input.dryRun);

  const channels: ChannelResult[] = [];
  const emailTo = (input.email ?? readDefaultNotifyEmail() ?? "").trim();
  const telegramChatId = (
    input.telegramChatId ??
    readDefaultTelegramChatId() ??
    ""
  ).trim();

  if (input.channelEmail) {
    if (!shouldSend && items.length === 0 && !input.forceTestMessage) {
      channels.push({
        channel: "email",
        ok: true,
        skipped: true,
        message: "无到期域名，已跳过邮件",
      });
    } else {
      const body =
        input.forceTestMessage && items.length === 0
          ? `${input.title ?? "BrutalDomain 通知测试"}\n\n这是一条连通性测试消息。\n当前窗口 ${input.windowDays} 天内没有到期域名。`
          : text;
      const result = await sendEmailMessage({
        to: emailTo,
        subject:
          items.length > 0
            ? `域名到期提醒（${items.length}）`
            : (input.title ?? "BrutalDomain 通知测试"),
        text: body,
        dryRun: input.dryRun,
      });
      channels.push({
        channel: "email",
        ok: result.ok,
        skipped: result.skipped,
        message: result.message,
      });
    }
  }

  if (input.channelTelegram) {
    if (!shouldSend && items.length === 0 && !input.forceTestMessage) {
      channels.push({
        channel: "telegram",
        ok: true,
        skipped: true,
        message: "无到期域名，已跳过 Telegram",
      });
    } else {
      const body =
        input.forceTestMessage && items.length === 0
          ? `${input.title ?? "BrutalDomain 通知测试"}\n\n这是一条连通性测试消息。\n当前窗口 ${input.windowDays} 天内没有到期域名。`
          : text;
      const result = await sendTelegramMessage({
        chatId: telegramChatId,
        text: body,
        dryRun: input.dryRun,
      });
      channels.push({
        channel: "telegram",
        ok: result.ok,
        skipped: result.skipped,
        message: result.message,
      });
    }
  }

  return {
    scanned: list.domains.length,
    alertCount: items.length,
    items: items.slice(0, 20),
    text,
    channels,
  };
}
