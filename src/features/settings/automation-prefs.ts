export const AUTOMATION_PREFS_KEY = "brutaldomain.automation-prefs.v1";
export const AUTOMATION_PREFS_EVENT = "brutaldomain-automation-prefs";

export const EXPIRY_NOTIFY_DAY_OPTIONS = [1, 3, 7, 14, 30, 60, 90] as const;
export type ExpiryNotifyDayOption = (typeof EXPIRY_NOTIFY_DAY_OPTIONS)[number];

export const AUTO_RENEW_DAY_OPTIONS = [1, 3, 7, 14, 30] as const;
export type AutoRenewDayOption = (typeof AUTO_RENEW_DAY_OPTIONS)[number];

export interface AutomationPrefs {
  /** Master switch for expiry notifications */
  notifyEnabled: boolean;
  /** Days before expiry to start notifying */
  notifyDays: ExpiryNotifyDayOption;
  /** Also notify when already expired */
  notifyExpired: boolean;
  /** Channels */
  channelInApp: boolean;
  channelBrowser: boolean;
  channelEmail: boolean;
  channelTelegram: boolean;
  email: string;
  telegramChatId: string;
  /** Optional Telegram bot token note: never store secrets client-side in production.
   *  We only keep a local placeholder flag that bot is "configured" via env later. */
  telegramHint: string;
  /** Auto renew */
  autoRenewEnabled: boolean;
  autoRenewDays: AutoRenewDayOption;
  autoRenewYears: 1 | 2 | 3;
  /** Require manual confirm even when auto renew is on (safer default) */
  autoRenewRequireConfirm: boolean;
  /** Only renew Registered domains */
  autoRenewRegisteredOnly: boolean;
}

export const DEFAULT_AUTOMATION_PREFS: AutomationPrefs = {
  notifyEnabled: true,
  notifyDays: 30,
  notifyExpired: true,
  channelInApp: true,
  channelBrowser: false,
  channelEmail: false,
  channelTelegram: false,
  email: "",
  telegramChatId: "",
  telegramHint: "",
  autoRenewEnabled: false,
  autoRenewDays: 7,
  autoRenewYears: 1,
  autoRenewRequireConfirm: true,
  autoRenewRegisteredOnly: true,
};

function isNotifyDay(value: unknown): value is ExpiryNotifyDayOption {
  return (
    typeof value === "number" &&
    (EXPIRY_NOTIFY_DAY_OPTIONS as readonly number[]).includes(value)
  );
}

function isAutoRenewDay(value: unknown): value is AutoRenewDayOption {
  return (
    typeof value === "number" &&
    (AUTO_RENEW_DAY_OPTIONS as readonly number[]).includes(value)
  );
}

function isYears(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

export function normalizeAutomationPrefs(
  partial: Partial<AutomationPrefs> | null | undefined,
): AutomationPrefs {
  const base = { ...DEFAULT_AUTOMATION_PREFS, ...(partial ?? {}) };
  return {
    notifyEnabled: Boolean(base.notifyEnabled),
    notifyDays: isNotifyDay(base.notifyDays)
      ? base.notifyDays
      : DEFAULT_AUTOMATION_PREFS.notifyDays,
    notifyExpired: Boolean(base.notifyExpired),
    channelInApp: Boolean(base.channelInApp),
    channelBrowser: Boolean(base.channelBrowser),
    channelEmail: Boolean(base.channelEmail),
    channelTelegram: Boolean(base.channelTelegram),
    email: typeof base.email === "string" ? base.email.trim() : "",
    telegramChatId:
      typeof base.telegramChatId === "string" ? base.telegramChatId.trim() : "",
    telegramHint:
      typeof base.telegramHint === "string" ? base.telegramHint.trim() : "",
    autoRenewEnabled: Boolean(base.autoRenewEnabled),
    autoRenewDays: isAutoRenewDay(base.autoRenewDays)
      ? base.autoRenewDays
      : DEFAULT_AUTOMATION_PREFS.autoRenewDays,
    autoRenewYears: isYears(base.autoRenewYears)
      ? base.autoRenewYears
      : DEFAULT_AUTOMATION_PREFS.autoRenewYears,
    autoRenewRequireConfirm: Boolean(base.autoRenewRequireConfirm),
    autoRenewRegisteredOnly: Boolean(base.autoRenewRegisteredOnly),
  };
}

export function readAutomationPrefs(): AutomationPrefs {
  if (typeof window === "undefined") return DEFAULT_AUTOMATION_PREFS;
  try {
    const raw = window.localStorage.getItem(AUTOMATION_PREFS_KEY);
    if (!raw) return DEFAULT_AUTOMATION_PREFS;
    return normalizeAutomationPrefs(
      JSON.parse(raw) as Partial<AutomationPrefs>,
    );
  } catch {
    return DEFAULT_AUTOMATION_PREFS;
  }
}

export function writeAutomationPrefs(prefs: AutomationPrefs) {
  if (typeof window === "undefined") return;
  const normalized = normalizeAutomationPrefs(prefs);
  window.localStorage.setItem(AUTOMATION_PREFS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(AUTOMATION_PREFS_EVENT));
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAutomationPrefs(prefs: AutomationPrefs): string[] {
  const errors: string[] = [];
  if (prefs.channelEmail && !isValidEmail(prefs.email)) {
    errors.push("启用邮件通知时需要填写有效邮箱");
  }
  if (prefs.channelTelegram && !prefs.telegramChatId.trim()) {
    errors.push("启用 Telegram 时需要填写 Chat ID");
  }
  if (
    prefs.notifyEnabled &&
    !prefs.channelInApp &&
    !prefs.channelBrowser &&
    !prefs.channelEmail &&
    !prefs.channelTelegram
  ) {
    errors.push("至少开启一种通知渠道");
  }
  return errors;
}
