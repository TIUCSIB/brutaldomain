"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SearchX,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { DomainFilters } from "@/components/domain-filters";
import { DomainFormDialog } from "@/components/domain-form-dialog";
import { DomainMobileList } from "@/components/domain-mobile-list";
import { DomainTable } from "@/components/domain-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  formatProviderLabel,
  getErrorMessage,
  matchesExpiryRisk,
  sortDomains,
  type DomainSort,
  type ExpiryRiskFilter,
  type ProviderFilter,
  type StatusFilter,
} from "@/features/domains/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function DomainsContent() {
  const { domains, error, features, hydrated, initialized, loading, refreshDomains } =
    useDomainStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const [expiryRisk, setExpiryRisk] = useState<ExpiryRiskFilter>("all");
  const [sort, setSort] = useState<DomainSort>("expiry-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [refreshing, setRefreshing] = useState(false);

  const providers = useMemo(
    () =>
      [
        ...new Set(
          domains.flatMap((domain) =>
            domain.provider_account_id === null ? [] : [domain.provider_account_id],
          ),
        ),
      ].sort((left, right) => left - right),
    [domains],
  );

  const filteredDomains = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = domains.filter((domain) => {
      const matchesSearch =
        !query ||
        [
          domain.full_domain,
          domain.subdomain,
          domain.rootdomain,
          domain.cloudflare_zone_id ?? "",
          String(domain.id),
          formatProviderLabel(domain.provider_account_id),
        ].some((value) => value.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (status === "all" || domain.status === status) &&
        (provider === "all" || domain.provider_account_id === provider) &&
        matchesExpiryRisk(domain, expiryRisk)
      );
    });
    return sortDomains(filtered, sort);
  }, [domains, expiryRisk, provider, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filteredDomains.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart =
    filteredDomains.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredDomains.length);
  const visibleDomains = filteredDomains.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const filtersActive =
    status !== "all" || provider !== "all" || expiryRisk !== "all" || sort !== "expiry-asc";

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setProvider("all");
    setExpiryRisk("all");
    setSort("expiry-asc");
    setPage(1);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshDomains();
      toast.success("域名数据已同步");
    } catch (caught) {
      toast.error("同步失败", { description: getErrorMessage(caught) });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="域名资产"
          title="域名管理"
          description="筛选并管理全部 DNSHE 域名，进入详情可编辑解析记录。"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                <RefreshCw className={refreshing ? "animate-spin" : ""} />
                同步
              </Button>
              <DomainFormDialog />
            </>
          }
        />

        <ConfigErrorBanner error={error} />

        <DomainFilters
          search={search}
          status={status}
          provider={provider}
          expiryRisk={expiryRisk}
          sort={sort}
          providers={providers}
          active={filtersActive}
          onSearchChange={(value) => resetPage(setSearch, value)}
          onStatusChange={(value) => resetPage(setStatus, value)}
          onProviderChange={(value) => resetPage(setProvider, value)}
          onExpiryRiskChange={(value) => resetPage(setExpiryRisk, value)}
          onSortChange={(value) => resetPage(setSort, value)}
          onReset={resetFilters}
        />

        <section aria-labelledby="domain-list-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="domain-list-title" className="text-lg font-black tracking-tight">
                域名清单
              </h2>
              <p aria-live="polite" className="mt-0.5 text-xs font-bold text-foreground/70">
                {!hydrated || !initialized
                  ? "正在加载域名…"
                  : `${filteredDomains.length} 条结果`}
                {search ? ` · 搜索 “${search}”` : ""}
              </p>
            </div>
          </div>

          {visibleDomains.length > 0 ? (
            <>
              <DomainTable domains={visibleDomains} />
              <DomainMobileList domains={visibleDomains} />
            </>
          ) : (
            <div className="grid min-h-48 place-items-center border-2 border-dashed border-border bg-secondary-background p-6 text-center shadow-shadow">
              <div>
                <span className="mx-auto grid size-12 place-items-center border-2 border-border bg-main/10 shadow-shadow">
                  <SearchX aria-hidden="true" className="size-6 text-main" strokeWidth={2.5} />
                </span>
                <h3 className="mt-3 text-base font-black">
                  {error ? "无法加载域名" : "没有匹配的域名"}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs font-bold text-foreground/70">
                  {error
                    ? "请先解决上方的 DNSHE 配置或请求错误。"
                    : "请调整搜索词或筛选条件。"}
                </p>
                {!error && (filtersActive || search) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="mt-3"
                  >
                    清除全部
                  </Button>
                ) : null}
                {!error && !filtersActive && !search && features.domainCreate ? (
                  <div className="mt-3">
                    <DomainFormDialog />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <nav
            aria-label="域名分页"
            className="flex flex-col gap-2 border-2 border-border bg-secondary-background p-2.5 shadow-shadow sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-center text-xs font-bold text-foreground/70 sm:text-left">
              显示 {rangeStart}–{rangeEnd} / 共 {filteredDomains.length} 条 · 第 {currentPage}/
              {totalPages} 页
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                <span>每页</span>
                <select
                  value={pageSize}
                  onChange={(event) =>
                    resetPage(setPageSize, Number(event.target.value) as PageSize)
                  }
                  className="h-8 rounded-none border-2 border-border bg-secondary-background px-2 font-black shadow-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} 条
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft aria-hidden="true" /> 上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                下一页 <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </section>
      </div>
    </AppShell>
  );
}
