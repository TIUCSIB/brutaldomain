import {
  isDomainSort,
  isExpiryRiskFilter,
  isStatusFilter,
  type DomainSort,
  type ExpiryRiskFilter,
  type ProviderFilter,
  type StatusFilter,
} from "@/features/domains/utils";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface DomainListParams {
  search: string;
  status: StatusFilter;
  provider: ProviderFilter;
  expiryRisk: ExpiryRiskFilter;
  sort: DomainSort;
  page: number;
  pageSize: PageSize;
}

function isDefaultParam(key: string, value: string) {
  if (key === "sort") return value === "expiry-asc";
  if (key === "page") return value === "1";
  if (key === "pageSize") return value === "20";
  if (key === "status" || key === "provider" || key === "risk") {
    return value === "all";
  }
  if (key === "q") return value === "";
  return false;
}

export function parsePageSize(value: string | null): PageSize {
  const n = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
    ? (n as PageSize)
    : 20;
}

export function parseProvider(value: string | null): ProviderFilter {
  if (!value || value === "all") return "all";
  const n = Number(value);
  return Number.isFinite(n) ? n : "all";
}

export function readDomainListParams(
  searchParams: URLSearchParams,
): DomainListParams {
  const statusParam = searchParams.get("status") ?? "all";
  const riskParam = searchParams.get("risk") ?? "all";
  const sortParam = searchParams.get("sort") ?? "expiry-asc";

  return {
    search: searchParams.get("q") ?? "",
    status: isStatusFilter(statusParam) ? statusParam : "all",
    provider: parseProvider(searchParams.get("provider")),
    expiryRisk: isExpiryRiskFilter(riskParam) ? riskParam : "all",
    sort: isDomainSort(sortParam) ? sortParam : "expiry-asc",
    page: Math.max(1, Number(searchParams.get("page") ?? "1") || 1),
    pageSize: parsePageSize(searchParams.get("pageSize")),
  };
}

export function applyDomainListParamPatch(
  current: URLSearchParams,
  patch: Record<string, string | null>,
  options?: { resetPage?: boolean },
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "" || isDefaultParam(key, value)) {
      next.delete(key);
      continue;
    }
    next.set(key, value);
  }
  if (options?.resetPage !== false && !("page" in patch)) {
    next.delete("page");
  }
  return next;
}
