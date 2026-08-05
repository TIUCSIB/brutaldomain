"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { DomainFilters } from "@/components/domain-filters";
import {
  DomainListPrefsBar,
  useDomainListPrefs,
} from "@/components/domain-list-prefs-bar";
import { DomainsListSection } from "@/components/domains-list-section";
import { DomainsPageActions } from "@/components/domains-page-actions";
import { DomainsListSkeleton } from "@/components/page-skeletons";
import { PageHeader } from "@/components/page-header";
import { toast } from "@/components/ui/sonner";
import { buildDomainFilterPresetChips } from "@/features/domains/domain-filter-presets";
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
  const { columns } = useDomainListPrefs();

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

  const filterPresets = useMemo(
    () =>
      buildDomainFilterPresetChips(
        { expiryRisk, status, sort, search },
        setParams,
      ),
    [expiryRisk, search, setParams, sort, status],
  );

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
    toast.success(`已导出筛选结果 ${count} 条`);
  }

  function handleExportSelected() {
    const selected = filteredDomains.filter((domain) =>
      selectedIds.has(domain.id),
    );
    const count = downloadDomainsCsv(selected);
    if (count === 0) {
      toast.error("请先勾选要导出的域名");
      return;
    }
    toast.success(`已导出勾选 ${count} 条`);
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

  if (!hydrated || (!initialized && loading && domains.length === 0)) {
    return <DomainsListSkeleton />;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="域名资产"
          title="域名管理"
          description="筛选并管理全部 DNSHE 域名，进入详情可编辑解析记录。"
          actions={
            <DomainsPageActions
              selectedCount={selectedIds.size}
              canExport={filteredDomains.length > 0}
              canExportSelected={selectedIds.size > 0}
              refreshing={refreshing}
              loading={loading}
              onCopy={() => void handleCopySelected()}
              onExport={handleExport}
              onExportSelected={handleExportSelected}
              onRefresh={() => void handleRefresh()}
            />
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
          presets={filterPresets}
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

        <DomainListPrefsBar
          currentQuery={searchParams.toString()}
          onApplyView={(query) => {
            router.replace(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          }}
        />

        <DomainsListSection
          filteredCount={filteredDomains.length}
          search={search}
          initialized={initialized}
          visibleDomains={visibleDomains}
          selectedIds={selectedIds}
          columns={columns}
          error={error}
          filtersActive={filtersActive}
          canCreate={features.domainCreate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAllVisible}
          onReset={resetFilters}
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
            setParams({ page: String(currentPage + 1) }, { resetPage: false })
          }
        />
      </div>
    </AppShell>
  );
}
