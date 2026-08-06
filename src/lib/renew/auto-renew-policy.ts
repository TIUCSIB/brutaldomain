import {
  AUTO_RENEW_MAX_DAYS,
  canRenewByRemainingDays,
} from "@/features/settings/automation-prefs";
import type { ServerRenewPrefs } from "@/features/settings/server-renew-prefs";
import { getExpiryDays } from "@/features/domains/utils";
import type { Subdomain } from "@/features/domains/types";

export type AutoRenewSkipReason =
  | "never_expires"
  | "invalid_expiry"
  | "expired"
  | "outside_window"
  | "status_not_registered";

export interface AutoRenewCandidate {
  domain: Subdomain;
  remainingDays: number;
  previousExpiresAt: string;
}

export type AutoRenewDecision =
  | {
      eligible: true;
      remainingDays: number;
      previousExpiresAt: string;
    }
  | {
      eligible: false;
      reason: AutoRenewSkipReason;
      remainingDays: number | null;
    };

export function decideAutoRenew(
  domain: Subdomain,
  prefs: Pick<ServerRenewPrefs, "autoRenewDays" | "autoRenewRegisteredOnly">,
  now = new Date(),
): AutoRenewDecision {
  if (domain.never_expires === 1) {
    return { eligible: false, reason: "never_expires", remainingDays: null };
  }

  const remainingDays = getExpiryDays(domain, now);
  if (remainingDays === null) {
    return { eligible: false, reason: "invalid_expiry", remainingDays: null };
  }
  if (
    prefs.autoRenewRegisteredOnly &&
    domain.status !== "Registered"
  ) {
    return { eligible: false, reason: "status_not_registered", remainingDays };
  }
  if (
    !canRenewByRemainingDays(remainingDays) ||
    remainingDays > Math.min(prefs.autoRenewDays, AUTO_RENEW_MAX_DAYS)
  ) {
    return {
      eligible: false,
      reason: remainingDays < 0 ? "expired" : "outside_window",
      remainingDays,
    };
  }

  return {
    eligible: true,
    remainingDays,
    previousExpiresAt: domain.expires_at,
  };
}

export function selectAutoRenewCandidates(
  domains: readonly Subdomain[],
  prefs: Pick<ServerRenewPrefs, "autoRenewDays" | "autoRenewRegisteredOnly">,
  options: { now?: Date; limit?: number } = {},
): AutoRenewCandidate[] {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 10;
  return domains
    .map((domain) => ({ domain, decision: decideAutoRenew(domain, prefs, now) }))
    .filter(
      (
        item,
      ): item is {
        domain: Subdomain;
        decision: Extract<AutoRenewDecision, { eligible: true }>;
      } => item.decision.eligible,
    )
    .sort((left, right) => left.decision.remainingDays - right.decision.remainingDays)
    .slice(0, limit)
    .map(({ domain, decision }) => ({
      domain,
      remainingDays: decision.remainingDays,
      previousExpiresAt: decision.previousExpiresAt,
    }));
}
