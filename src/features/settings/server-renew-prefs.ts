import {
  AUTO_RENEW_DAY_OPTIONS,
  AUTO_RENEW_MAX_DAYS,
  type AutoRenewDayOption,
} from "./automation-prefs";

export const AUTO_RENEW_SCAN_INTERVAL_DAYS = 10;
export const AUTO_RENEW_SCAN_INTERVAL_MS =
  AUTO_RENEW_SCAN_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
export const AUTO_RENEW_BATCH_LIMIT = 10;

export interface ServerRenewPrefs {
  autoRenewEnabled: boolean;
  autoRenewDays: AutoRenewDayOption;
  autoRenewRegisteredOnly: boolean;
  notifyOnSuccess: boolean;
  channelEmail: boolean;
  channelTelegram: boolean;
  email: string;
  telegramChatId: string;
  telegramHint: string;
  consentAt: string | null;
  lastRunAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export const DEFAULT_SERVER_RENEW_PREFS: ServerRenewPrefs = {
  autoRenewEnabled: false,
  autoRenewDays: AUTO_RENEW_MAX_DAYS,
  autoRenewRegisteredOnly: false,
  notifyOnSuccess: false,
  channelEmail: false,
  channelTelegram: false,
  email: "",
  telegramChatId: "",
  telegramHint: "",
  consentAt: null,
  lastRunAt: null,
  updatedAt: null,
  updatedBy: null,
};

function isAutoRenewDay(value: unknown): value is AutoRenewDayOption {
  return (
    typeof value === "number" &&
    value <= AUTO_RENEW_MAX_DAYS &&
    (AUTO_RENEW_DAY_OPTIONS as readonly number[]).includes(value)
  );
}

export function isValidRenewNotifyEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeServerRenewPrefs(
  partial: Partial<ServerRenewPrefs> | null | undefined,
): ServerRenewPrefs {
  const base = { ...DEFAULT_SERVER_RENEW_PREFS, ...(partial ?? {}) };
  return {
    autoRenewEnabled: Boolean(base.autoRenewEnabled),
    autoRenewDays: isAutoRenewDay(base.autoRenewDays)
      ? base.autoRenewDays
      : DEFAULT_SERVER_RENEW_PREFS.autoRenewDays,
    autoRenewRegisteredOnly: Boolean(base.autoRenewRegisteredOnly),
    notifyOnSuccess: Boolean(base.notifyOnSuccess),
    channelEmail: Boolean(base.channelEmail),
    channelTelegram: Boolean(base.channelTelegram),
    email: typeof base.email === "string" ? base.email.trim() : "",
    telegramChatId:
      typeof base.telegramChatId === "string" ? base.telegramChatId.trim() : "",
    telegramHint:
      typeof base.telegramHint === "string" ? base.telegramHint.trim() : "",
    consentAt:
      typeof base.consentAt === "string" && base.consentAt
        ? base.consentAt
        : null,
    lastRunAt:
      typeof base.lastRunAt === "string" && base.lastRunAt
        ? base.lastRunAt
        : null,
    updatedAt:
      typeof base.updatedAt === "string" && base.updatedAt
        ? base.updatedAt
        : null,
    updatedBy:
      typeof base.updatedBy === "string" && base.updatedBy
        ? base.updatedBy
        : null,
  };
}

export function validateRenewNotificationTargets(
  prefs: Pick<
    ServerRenewPrefs,
    "channelEmail" | "channelTelegram" | "email" | "telegramChatId"
  >,
): string[] {
  const errors: string[] = [];
  if (!prefs.channelEmail && !prefs.channelTelegram) {
    errors.push("请至少启用一种测试通知渠道");
  }
  if (prefs.channelEmail && !isValidRenewNotifyEmail(prefs.email)) {
    errors.push("启用邮件通知时需要填写有效邮箱");
  }
  if (prefs.channelTelegram && !prefs.telegramChatId.trim()) {
    errors.push("启用 Telegram 时需要填写 Chat ID");
  }
  return errors;
}

export function validateServerRenewPrefs(prefs: ServerRenewPrefs): string[] {
  const errors: string[] = [];
  if (prefs.autoRenewEnabled && !prefs.consentAt) {
    errors.push("启用自动续费前需要确认无人值守续费和配额消耗");
  }
  if (prefs.notifyOnSuccess) {
    errors.push(...validateRenewNotificationTargets(prefs));
  }
  return errors;
}

export function getNextAutoRenewRunAt(lastRunAt: string | null): Date | null {
  if (!lastRunAt) return null;
  const timestamp = Date.parse(lastRunAt);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp + AUTO_RENEW_SCAN_INTERVAL_MS);
}

export function isAutoRenewDue(
  lastRunAt: string | null,
  now = new Date(),
): boolean {
  if (!lastRunAt) return true;
  const timestamp = Date.parse(lastRunAt);
  return (
    !Number.isFinite(timestamp) ||
    now.getTime() >= timestamp + AUTO_RENEW_SCAN_INTERVAL_MS
  );
}
