"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, Download, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { DomainFilters } from "@/components/domain-filters";
import { DomainFormDialog } from "@/components/domain-form-dialog";
import { DomainListEmpty } from "@/components/domain-list-empty";
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
import { useDomainSelection } from "@/features/domains/use-domain-selection";
import {
  downloadDomainsCsv,
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

  const {
    selectedIds,
    toggleSelect,
    toggleSelectAllVisible,
    copySelectedNames,
  } = useDomainSelection(filteredDomains, visibleDomains);

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
    const count = downloadDomainsCsv(filteredDomains);
    if (count === 0) {
      toast.error("没有可导出的域名");
      return;
    }
    toast.success(`已导出 ${count} 条`);
  }

  async function handleCopySelected() {
    const result = await copySelectedNames();
    if (result.ok) {
      toast.success(`已复制 ${result.count} 个域名`);
      return;
    }
    toast.error(
      result.reason === "empty" ? "请先勾选要复制的域名" : "复制失败",
    );
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
                onClick={() => void handleCopySelected()}
                disabled={selectedIds.size === 0}
              >
                <Copy />
                复制{selectedIds.size > 0 ? ` ${selectedIds.size}` : ""}
              </Button>
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
              <DomainTable
                domains={visibleDomains}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAllVisible}
              />
              <DomainMobileList
                domains={visibleDomains}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </>
          ) : (
            <DomainListEmpty
              error={error}
              filtersActive={filtersActive}
              canCreate={features.domainCreate}
              onReset={resetFilters}
            />
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
