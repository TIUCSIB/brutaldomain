import { redirectIfUnauthorized } from "@/lib/api/request-error";

import type { DomainStatus, Subdomain } from "./types";

export const EXPIRY_WINDOW_DAYS = 90;

export type StatusFilter = DomainStatus | "all";
export type ProviderFilter = number | "all";
export type ExpiryRiskFilter =
  | "all"
  | "expired"
  | "within-7"
  | "within-30"
  | "within-90"
  | "healthy"
  | "never";
export type DomainSort =
  | "expiry-asc"
  | "expiry-desc"
  | "created-desc"
  | "created-asc"
  | "domain-asc"
  | "domain-desc";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function parseDomainDate(value: string): Date {
  return new Date(value.replace(" ", "T"));
}

function toTimestamp(value: string): number | null {
  const timestamp = parseDomainDate(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getExpiryDays(domain: Subdomain, now = new Date()): number | null {
  if (domain.never_expires === 1) return null;

  const expiresAt = toTimestamp(domain.expires_at);
  if (expiresAt === null) return null;

  return Math.ceil((expiresAt - now.getTime()) / DAY_IN_MS);
}

export function isExpiringWithin(
  domain: Subdomain,
  days = EXPIRY_WINDOW_DAYS,
  now = new Date(),
): boolean {
  const remaining = getExpiryDays(domain, now);
  return remaining !== null && remaining >= 0 && remaining <= days;
}

export function matchesExpiryRisk(
  domain: Subdomain,
  risk: ExpiryRiskFilter,
  now = new Date(),
): boolean {
  if (risk === "all") return true;
  if (risk === "never") return domain.never_expires === 1;

  const remaining = getExpiryDays(domain, now);
  if (remaining === null) return false;
  if (risk === "expired") return remaining < 0;
  if (risk === "within-7") {
    return remaining >= 0 && remaining <= 7;
  }
  if (risk === "within-30") {
    return remaining >= 0 && remaining <= 30;
  }
  if (risk === "within-90") {
    return remaining >= 0 && remaining <= EXPIRY_WINDOW_DAYS;
  }

  return remaining > EXPIRY_WINDOW_DAYS;
}

export function isExpiryRiskFilter(value: string): value is ExpiryRiskFilter {
  return (
    value === "all" ||
    value === "expired" ||
    value === "within-7" ||
    value === "within-30" ||
    value === "within-90" ||
    value === "healthy" ||
    value === "never"
  );
}

export function isDomainSort(value: string): value is DomainSort {
  return (
    value === "expiry-asc" ||
    value === "expiry-desc" ||
    value === "created-desc" ||
    value === "created-asc" ||
    value === "domain-asc" ||
    value === "domain-desc"
  );
}

export function isStatusFilter(value: string): value is StatusFilter {
  return (
    value === "all" ||
    value === "Registered" ||
    value === "Pending" ||
    value === "Suspended" ||
    value === "Expired" ||
    value === "Error"
  );
}

export function domainsToCsv(domains: readonly Subdomain[]): string {
  const header = [
    "id",
    "full_domain",
    "subdomain",
    "rootdomain",
    "status",
    "expires_at",
    "never_expires",
    "provider_account_id",
    "created_at",
    "updated_at",
  ];
  const escape = (value: string | number | null) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };
  const rows = domains.map((domain) =>
    [
      domain.id,
      domain.full_domain,
      domain.subdomain,
      domain.rootdomain,
      domain.status,
      domain.expires_at,
      domain.never_expires,
      domain.provider_account_id,
      domain.created_at,
      domain.updated_at,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function formatDomainDate(value: string): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return value || "—";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

export function formatProviderLabel(providerId: number | null): string {
  return providerId === null ? "未分配" : `#${providerId}`;
}

export function formatExpiry(
  domain: Subdomain,
  now = new Date(),
): {
  label: string;
  detail: string;
  tone: "red" | "yellow" | "green" | "blue";
} {
  if (domain.never_expires === 1) {
    return { label: "永不过期", detail: "Never expires", tone: "blue" };
  }

  const remaining = getExpiryDays(domain, now);
  if (remaining === null) {
    return {
      label: formatDomainDate(domain.expires_at),
      detail: "暂无到期信息",
      tone: "blue",
    };
  }

  if (remaining < 0) {
    return {
      label: formatDomainDate(domain.expires_at),
      detail: `已过期 ${Math.abs(remaining)} 天`,
      tone: "red",
    };
  }

  if (remaining <= EXPIRY_WINDOW_DAYS) {
    return {
      label: formatDomainDate(domain.expires_at),
      detail: `${remaining} 天后到期`,
      tone: "yellow",
    };
  }

  return {
    label: formatDomainDate(domain.expires_at),
    detail: `${remaining} days left`,
    tone: "green",
  };
}

function compareDate(left: string, right: string): number {
  const leftTimestamp = toTimestamp(left) ?? Number.MAX_SAFE_INTEGER;
  const rightTimestamp = toTimestamp(right) ?? Number.MAX_SAFE_INTEGER;
  return leftTimestamp - rightTimestamp;
}

export function sortDomains(
  domains: readonly Subdomain[],
  sort: DomainSort,
): Subdomain[] {
  return [...domains].sort((left, right) => {
    switch (sort) {
      case "expiry-asc":
        if (left.never_expires !== right.never_expires) {
          return left.never_expires - right.never_expires;
        }
        return compareDate(left.expires_at, right.expires_at);
      case "expiry-desc":
        if (left.never_expires !== right.never_expires) {
          return right.never_expires - left.never_expires;
        }
        return compareDate(right.expires_at, left.expires_at);
      case "created-desc":
        return compareDate(right.created_at, left.created_at);
      case "created-asc":
        return compareDate(left.created_at, right.created_at);
      case "domain-desc":
        return right.full_domain.localeCompare(left.full_domain);
      case "domain-asc":
      default:
        return left.full_domain.localeCompare(right.full_domain);
    }
  });
}

export function getErrorMessage(error: unknown): string {
  redirectIfUnauthorized(error);
  return error instanceof Error ? error.message : "未知错误，请重试";
}
