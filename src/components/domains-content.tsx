"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, RefreshCw, SearchX } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { DomainFilters } from "@/components/domain-filters";
import { DomainFormDialog } from "@/components/domain-form-dialog";
import { DomainListPagination } from "@/components/domain-list-pagination";
import { DomainMobileList } from "@/components/domain-mobile-list";
import { DomainTable } from "@/components/domain-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  applyDomainListParamPatch,
  readDomainListParams,
} from "@/features/domains/domain-list-params";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  domainsToCsv,
  formatProviderLabel,
  getErrorMessage,
  matchesExpiryRisk,
  sortDomains,
} from "@/features/domains/utils";

export function DomainsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { domains, error, features, hydrated, initialized, loading, refreshDomains } =
    useDomainStore();

  const { search, status, provider, expiryRisk, sort, page, pageSize } =
    readDomainListParams(searchParams);
  const [refreshing, setRefreshing] = useState(false);

  const setParams = useCallback(
    (patch: Record<string, string | null>, options?: { resetPage?: boolean }) => {
      const next = applyDomainListParamPatch(searchParams, patch, options);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
    status !== "all" ||
    provider !== "all" ||
    expiryRisk !== "all" ||
    sort !== "expiry-asc" ||
    Boolean(search.trim());

  useEffect(() => {
    if (page !== currentPage) {
      setParams({ page: currentPage === 1 ? null : String(currentPage) }, {
        resetPage: false,
      });
    }
  }, [currentPage, page, setParams]);

  function resetFilters() {
    router.replace(pathname, { scroll: false });
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

  function handleExport() {
    if (filteredDomains.length === 0) {
      toast.error("没有可导出的域名");
      return;
    }
    const csv = domainsToCsv(filteredDomains);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `domains-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${filteredDomains.length} 条`);
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
                onClick={handleExport}
                disabled={filteredDomains.length === 0}
              >
                <Download />
                导出
              </Button>
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
          onSearchChange={(value) => setParams({ q: value || null })}
          onStatusChange={(value) =>
            setParams({ status: value === "all" ? null : value })
          }
          onProviderChange={(value) =>
            setParams({
              provider: value === "all" ? null : String(value),
            })
          }
          onExpiryRiskChange={(value) =>
            setParams({ risk: value === "all" ? null : value })
          }
          onSortChange={(value) =>
            setParams({ sort: value === "expiry-asc" ? null : value })
          }
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
                {!error && filtersActive ? (
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
                {!error && !filtersActive && features.domainCreate ? (
                  <div className="mt-3">
                    <DomainFormDialog />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <DomainListPagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filteredDomains.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageSizeChange={(value) =>
              setParams({
                pageSize: value === "20" ? null : value,
                page: null,
              })
            }
            onPrev={() =>
              setParams(
                {
                  page: currentPage - 1 <= 1 ? null : String(currentPage - 1),
                },
                { resetPage: false },
              )
            }
            onNext={() =>
              setParams(
                { page: String(currentPage + 1) },
                { resetPage: false },
              )
            }
          />
        </section>
      </div>
    </AppShell>
  );
}
