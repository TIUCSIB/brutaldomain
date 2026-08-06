export const AUTO_RENEW_MAX_DAYS = 180;

export const AUTO_RENEW_DAY_OPTIONS = [7, 14, 30, 60, 90, 180] as const;export type AutoRenewDayOption = (typeof AUTO_RENEW_DAY_OPTIONS)[number];

/**
 * DNSHE renew eligibility: remaining days must be ≤ 180
 * (includes already expired; excludes never-expires elsewhere).
 */
export function canRenewByRemainingDays(
  remainingDays: number | null,
): boolean {
  if (remainingDays === null) return false;
  return remainingDays <= AUTO_RENEW_MAX_DAYS;
}

/** Auto-renew trigger: still active and within configured window (≤ 180). */
export function isWithinAutoRenewWindow(
  remainingDays: number | null,
  windowDays: number = AUTO_RENEW_MAX_DAYS,
): boolean {
  if (remainingDays === null || remainingDays < 0) return false;
  const capped = Math.min(windowDays, AUTO_RENEW_MAX_DAYS);
  return remainingDays <= capped;
}
