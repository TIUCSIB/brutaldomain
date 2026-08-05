/**
 * Delivery preferences controlled by Settings UI (not secrets).
 * Secrets (RESEND_API_KEY / TELEGRAM_BOT_TOKEN / CRON_SECRET) stay in env only.
 */

export const EXPIRY_NOTIFY_DAY_OPTIONS = [1, 3, 7, 14, 30, 60, 90] as const;
export type ExpiryNotifyDayOption = (typeof EXPIRY_NOTIFY_DAY_OPTIONS)[number];

export interface ServerNotifyPrefs {
  notifyEnabled: boolean;
  notifyDays: ExpiryNotifyDayOption;
  notifyExpired: boolean;
  channelEmail: boolean;
  channelTelegram: boolean;
  email: string;
  telegramChatId: string;
  telegramHint: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export const DEFAULT_SERVER_NOTIFY_PREFS: ServerNotifyPrefs = {
  notifyEnabled: true,
  notifyDays: 30,
  notifyExpired: true,
  channelEmail: false,
  channelTelegram: false,
  email: "",
  telegramChatId: "",
  telegramHint: "",
  updatedAt: null,
  updatedBy: null,
};

function isNotifyDay(value: unknown): value is ExpiryNotifyDayOption {
  return (
    typeof value === "number" &&
    (EXPIRY_NOTIFY_DAY_OPTIONS as readonly number[]).includes(value)
  );
}

export function isValidNotifyEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeServerNotifyPrefs(
  partial: Partial<ServerNotifyPrefs> | null | undefined,
): ServerNotifyPrefs {
  const base = { ...DEFAULT_SERVER_NOTIFY_PREFS, ...(partial ?? {}) };
  return {
    notifyEnabled: Boolean(base.notifyEnabled),
    notifyDays: isNotifyDay(base.notifyDays)
      ? base.notifyDays
      : DEFAULT_SERVER_NOTIFY_PREFS.notifyDays,
    notifyExpired: Boolean(base.notifyExpired),
    channelEmail: Boolean(base.channelEmail),
    channelTelegram: Boolean(base.channelTelegram),
    email: typeof base.email === "string" ? base.email.trim() : "",
    telegramChatId:
      typeof base.telegramChatId === "string" ? base.telegramChatId.trim() : "",
    telegramHint:
      typeof base.telegramHint === "string" ? base.telegramHint.trim() : "",
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

export function validateServerNotifyPrefs(
  prefs: ServerNotifyPrefs,
): string[] {
  const errors: string[] = [];
  if (prefs.channelEmail && !isValidNotifyEmail(prefs.email)) {
    errors.push("启用邮件通知时需要填写有效邮箱");
  }
  if (prefs.channelTelegram && !prefs.telegramChatId.trim()) {
    errors.push("启用 Telegram 时需要填写 Chat ID");
  }
  if (
    prefs.notifyEnabled &&
    !prefs.channelEmail &&
    !prefs.channelTelegram
  ) {
    // In-app/browser are client-only; server delivery needs at least one remote channel
    // when master switch is on for cron — allow save with both off (cron will no-op).
  }
  return errors;
}
