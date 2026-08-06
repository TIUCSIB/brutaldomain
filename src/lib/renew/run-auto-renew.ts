import "server-only";

import {
  DnsheDomainRepository,
  DnsheRenewalRefreshError,
} from "@/features/domains/dnshe-domain-repository";
import type { ServerRenewPrefs } from "@/features/settings/server-renew-prefs";
import { DnsheApiError } from "@/lib/dnshe/client";
import {
  decideAutoRenew,
  selectAutoRenewCandidates,
  type AutoRenewSkipReason,
} from "@/lib/renew/auto-renew-policy";
import {
  renewHistoryKey,
  type RenewHistoryEntry,
  type RenewRunState,
} from "@/lib/renew/renew-state-store";

export interface AutoRenewRunItem extends RenewHistoryEntry {
  remainingDays?: number;
}

export interface RunAutoRenewInput {
  prefs: ServerRenewPrefs;
  state: RenewRunState;
  dryRun?: boolean;
  now?: Date;
}

export interface RunAutoRenewResult {
  scanned: number;
  candidateCount: number;
  items: AutoRenewRunItem[];
}

function errorDetails(error: unknown): Pick<
  AutoRenewRunItem,
  "errorCode" | "errorMessage"
> {
  if (error instanceof DnsheApiError) {
    return { errorCode: error.code, errorMessage: error.message };
  }
  return {
    errorCode: error instanceof Error ? error.name : "unknown_error",
    errorMessage: error instanceof Error ? error.message : "Unknown renewal error",
  };
}

function skippedItem(
  domainId: number,
  fullDomain: string,
  previousExpiresAt: string,
  windowDays: number,
  reason: AutoRenewSkipReason | "duplicate",
  createdAt: string,
  source: "cron" | "preview",
): AutoRenewRunItem {
  return {
    key: renewHistoryKey(domainId, previousExpiresAt),
    domainId,
    fullDomain,
    previousExpiresAt,
    windowDays,
    outcome: "skipped",
    createdAt,
    source,
    errorCode: reason,
    errorMessage: `已跳过：${reason}`,
  };
}

export async function runAutoRenew(
  input: RunAutoRenewInput,
): Promise<RunAutoRenewResult> {
  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const source = input.dryRun ? "preview" : "cron";
  const repository = new DnsheDomainRepository();
  const list = await repository.listDomains();
  const candidates = selectAutoRenewCandidates(list.domains, input.prefs, {
    now,
    limit: 10,
  });
  const seen = new Set(input.state.history.map((item) => item.key));
  const items: AutoRenewRunItem[] = [];

  for (const candidate of candidates) {
    const key = renewHistoryKey(candidate.domain.id, candidate.previousExpiresAt);
    if (seen.has(key)) {
      items.push(
        skippedItem(
          candidate.domain.id,
          candidate.domain.full_domain,
          candidate.previousExpiresAt,
          input.prefs.autoRenewDays,
          "duplicate",
          createdAt,
          source,
        ),
      );
      continue;
    }

    if (input.dryRun) {
      items.push({
        key,
        domainId: candidate.domain.id,
        fullDomain: candidate.domain.full_domain,
        previousExpiresAt: candidate.previousExpiresAt,
        windowDays: input.prefs.autoRenewDays,
        outcome: "skipped",
        createdAt,
        source,
        remainingDays: candidate.remainingDays,
        errorCode: "preview",
        errorMessage: "预检通过，未调用 DNSHE 续费接口",
      });
      continue;
    }

    try {
      const fresh = await repository.getDomain(candidate.domain.id);
      const decision = decideAutoRenew(fresh.domain, input.prefs, now);
      if (!decision.eligible) {
        items.push(
          skippedItem(
            fresh.domain.id,
            fresh.domain.full_domain,
            fresh.domain.expires_at,
            input.prefs.autoRenewDays,
            decision.reason,
            createdAt,
            source,
          ),
        );
        continue;
      }

      const freshKey = renewHistoryKey(
        fresh.domain.id,
        decision.previousExpiresAt,
      );
      if (seen.has(freshKey)) {
        items.push(
          skippedItem(
            fresh.domain.id,
            fresh.domain.full_domain,
            decision.previousExpiresAt,
            input.prefs.autoRenewDays,
            "duplicate",
            createdAt,
            source,
          ),
        );
        continue;
      }

      const receipt = await repository.renewDomainWithReceipt(fresh.domain.id);
      items.push({
        key: freshKey,
        domainId: fresh.domain.id,
        fullDomain: fresh.domain.full_domain,
        previousExpiresAt: receipt.previousExpiresAt,
        windowDays: input.prefs.autoRenewDays,
        outcome: "succeeded",
        createdAt,
        source,
        remainingDays: decision.remainingDays,
        renewedAt: receipt.renewedAt,
        newExpiresAt: receipt.newExpiresAt,
        chargedAmount: receipt.chargedAmount,
      });
    } catch (error) {
      if (error instanceof DnsheRenewalRefreshError) {
        items.push({
          key,
          domainId: candidate.domain.id,
          fullDomain: candidate.domain.full_domain,
          previousExpiresAt: error.receipt.previousExpiresAt,
          windowDays: input.prefs.autoRenewDays,
          outcome: "unknown",
          createdAt,
          source,
          remainingDays: candidate.remainingDays,
          renewedAt: error.receipt.renewedAt,
          newExpiresAt: error.receipt.newExpiresAt,
          chargedAmount: error.receipt.chargedAmount,
          errorCode: "refresh_error",
          errorMessage: error.message,
        });
      } else {
        items.push({
          key,
          domainId: candidate.domain.id,
          fullDomain: candidate.domain.full_domain,
          previousExpiresAt: candidate.previousExpiresAt,
          windowDays: input.prefs.autoRenewDays,
          outcome: "failed",
          createdAt,
          source,
          remainingDays: candidate.remainingDays,
          ...errorDetails(error),
        });
      }
    }
  }

  return {
    scanned: list.domains.length,
    candidateCount: candidates.length,
    items,
  };
}
