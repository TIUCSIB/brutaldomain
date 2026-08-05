import type { Subdomain } from "@/features/domains/types";
import { getExpiryDays } from "@/features/domains/utils";

export const NOTIFY_WINDOW_OPTIONS = [7, 30, 90] as const;
export type NotifyWindowDays = (typeof NOTIFY_WINDOW_OPTIONS)[number];

export type ExpiryAlertLevel = "expired" | "critical" | "warning";

export interface ExpiryAlert {
  domain: Subdomain;
  days: number;
  level: ExpiryAlertLevel;
}

const PREFS_KEY = "brutaldomain.expiry-notify.v1";

export interface ExpiryNotifyPrefs {
  windowDays: NotifyWindowDays;
  /** domainId -> expires_at snapshot when dismissed */
  dismissed: Record<string, string>;
}

const DEFAULT_PREFS: ExpiryNotifyPrefs = {
  windowDays: 30,
  dismissed: {},
};

export function isNotifyWindowDays(value: unknown): value is NotifyWindowDays {
  return (
    typeof value === "number" &&
    (NOTIFY_WINDOW_OPTIONS as readonly number[]).includes(value)
  );
}

export function readExpiryNotifyPrefs(): ExpiryNotifyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ExpiryNotifyPrefs>;
    const windowDays = isNotifyWindowDays(parsed.windowDays)
      ? parsed.windowDays
      : DEFAULT_PREFS.windowDays;
    const dismissed =
      parsed.dismissed && typeof parsed.dismissed === "object"
        ? Object.fromEntries(
            Object.entries(parsed.dismissed).filter(
              (entry): entry is [string, string] =>
                typeof entry[0] === "string" && typeof entry[1] === "string",
            ),
          )
        : {};
    return { windowDays, dismissed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeExpiryNotifyPrefs(prefs: ExpiryNotifyPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getExpiryAlerts(
  domains: readonly Subdomain[],
  options?: {
    now?: Date;
    windowDays?: number;
    dismissed?: Record<string, string>;
    /** When false, skip already-expired domains. Default true. */
    includeExpired?: boolean;
  },
): ExpiryAlert[] {
  const now = options?.now ?? new Date();
  const windowDays = options?.windowDays ?? 30;
  const dismissed = options?.dismissed ?? {};
  const includeExpired = options?.includeExpired ?? true;
  const alerts: ExpiryAlert[] = [];

  for (const domain of domains) {
    const days = getExpiryDays(domain, now);
    if (days === null) continue;
    if (days > windowDays) continue;
    if (!includeExpired && days < 0) continue;

    const key = String(domain.id);
    if (dismissed[key] && dismissed[key] === domain.expires_at) continue;

    let level: ExpiryAlertLevel = "warning";
    if (days < 0) level = "expired";
    else if (days <= 7) level = "critical";

    alerts.push({ domain, days, level });
  }

  return alerts.sort((left, right) => {
    if (left.days !== right.days) return left.days - right.days;
    return left.domain.full_domain.localeCompare(right.domain.full_domain);
  });
}

export function levelLabel(level: ExpiryAlertLevel): string {
  if (level === "expired") return "已过期";
  if (level === "critical") return "7 天内";
  return "窗口内";
}
