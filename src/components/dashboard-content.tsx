"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  RefreshCw,
  SearchX,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DomainFilters } from "@/components/domain-filters";
import { DomainFormDialog } from "@/components/domain-form-dialog";
import { DomainMobileList } from "@/components/domain-mobile-list";
import { DomainTable } from "@/components/domain-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  formatProviderLabel,
  getErrorMessage,
  isExpiringWithin,
  matchesExpiryRisk,
  sortDomains,
  type DomainSort,
  type ExpiryRiskFilter,
  type ProviderFilter,
  type StatusFilter,
} from "@/features/domains/utils";

const PAGE_SIZE = 6;

export function DashboardContent() {
  const { domains, features, hydrated, initialized, loading, refreshDomains, source } =
    useDomainStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const [expiryRisk, setExpiryRisk] = useState<ExpiryRiskFilter>("all");
  const [sort, setSort] = useState<DomainSort>("expiry-asc");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const providers = useMemo(
    () => [...new Set(domains.flatMap((domain) => domain.provider_account_id === null ? [] : [domain.provider_account_id]))].sort((left, right) => left - right),
    [domains],
  );
  const stats = useMemo(() => ({
    total: domains.length,
    registered: domains.filter((domain) => domain.status === "Registered").length,
    expiring: domains.filter((domain) => isExpiringWithin(domain)).length,
    providers: providers.length,
  }), [domains, providers.length]);

  const filteredDomains = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sortDomains(domains.filter((domain) => {
      const matchesSearch = !query || [
        domain.full_domain,
        domain.subdomain,
        domain.rootdomain,
        domain.cloudflare_zone_id ?? "",
        String(domain.id),
        formatProviderLabel(domain.provider_account_id),
      ].some((value) => value.toLocaleLowerCase().includes(query));
      return matchesSearch && (status === "all" || domain.status === status) && (provider === "all" || domain.provider_account_id === provider) && matchesExpiryRisk(domain, expiryRisk);
    }), sort);
  }, [domains, expiryRisk, provider, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filteredDomains.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleDomains = filteredDomains.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filteredDomains.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredDomains.length);
  const filtersActive = status !== "all" || provider !== "all" || expiryRisk !== "all" || sort !== "expiry-asc";
  const isLive = source === "dnshe";

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
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
      toast.success(isLive ? "DNSHE 已同步" : "Demo data reloaded / 演示数据已刷新");
    } catch (error) {
      toast.error("Refresh failed / 刷新失败", { description: getErrorMessage(error) });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <AppShell searchValue={search} onSearchChange={(value) => resetPage(setSearch, value)}>
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-block -rotate-1 border-2 border-slate-950 bg-[#ffd84d] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_0_#0f172a]">Dashboard · 总览</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">域名控制中心 <span className="text-[#1261ff]">Domain HQ</span></h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-600 sm:text-base">Monitor registrations, expiry risk and providers in one focused workspace. 一站式管理全部域名。</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing || loading} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a] hover:bg-blue-100"><RefreshCw className={refreshing ? "animate-spin" : ""} />Sync / 同步</Button>
              <DomainFormDialog />
            </div>
            {!features.domainCreate ? <p className="max-w-sm text-right text-xs font-bold text-slate-600">DNSHE 注册接口待文档补充，新增域名当前仅保留占位。</p> : null}
          </div>
        </header>

        <section aria-label="Domain statistics / 域名统计" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="总域名 Total domains" value={stats.total} description="All managed domains / 全部资产" icon={Globe2} tone="blue" />
          <StatCard title="Registered 已注册" value={stats.registered} description={`${stats.total === 0 ? 0 : Math.round((stats.registered / stats.total) * 100)}% healthy registration`} icon={CheckCircle2} tone="green" />
          <StatCard title="90 天内到期 Expiring" value={stats.expiring} description="Needs attention / 需关注" icon={AlertTriangle} tone="yellow" />
          <StatCard title="Providers 服务商" value={stats.providers} description="Unique provider accounts" icon={Building2} tone="neutral" />
        </section>

        <DomainFilters status={status} provider={provider} expiryRisk={expiryRisk} sort={sort} providers={providers} active={filtersActive} onStatusChange={(value) => resetPage(setStatus, value)} onProviderChange={(value) => resetPage(setProvider, value)} onExpiryRiskChange={(value) => resetPage(setExpiryRisk, value)} onSortChange={(value) => resetPage(setSort, value)} onReset={resetFilters} />

        <section aria-labelledby="domain-list-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="domain-list-title" className="text-2xl font-black tracking-tight">Domain inventory / 域名清单</h2>
              <p aria-live="polite" className="mt-1 text-sm font-bold text-slate-600">{!hydrated || !initialized ? "Loading domains… / 正在加载域名" : `${filteredDomains.length} results / 条结果`}{search ? ` · 搜索 “${search}”` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="border-2 border-slate-950 bg-white px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_0_#0f172a]">{isLive ? "LIVE DNSHE DATA" : "LOCAL DEMO DATA"}</span>
              {!features.domainRenew || !features.domainDelete || !features.domainRefresh ? <span className="border-2 border-slate-950 bg-[#ffd84d] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_0_#0f172a]">部分操作待接通</span> : null}
            </div>
          </div>

          {visibleDomains.length > 0 ? <><DomainTable domains={visibleDomains} /><DomainMobileList domains={visibleDomains} /></> : (
            <div className="grid min-h-72 place-items-center border-4 border-dashed border-slate-950 bg-white p-8 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center border-2 border-slate-950 bg-blue-100 shadow-[4px_4px_0_0_#0f172a]"><SearchX aria-hidden="true" className="size-8 text-blue-700" strokeWidth={2.5} /></span>
                <h3 className="mt-5 text-xl font-black">No domains found / 没有匹配域名</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-bold text-slate-600">Try another search or reset the filters. 请调整搜索词或筛选条件。</p>
                {filtersActive || search ? <Button type="button" variant="outline" onClick={() => { setSearch(""); resetFilters(); }} className="mt-5 rounded-none border-slate-950 bg-[#ffd84d] shadow-[3px_3px_0_0_#0f172a]">Clear all / 清除全部</Button> : <div className="mt-5"><DomainFormDialog /></div>}
              </div>
            </div>
          )}

          <nav aria-label="Domain pagination / 域名分页" className="flex flex-col gap-3 border-2 border-slate-950 bg-white p-3 shadow-[3px_3px_0_0_#0f172a] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm font-bold text-slate-600 sm:text-left">Showing {rangeStart}–{rangeEnd} of {filteredDomains.length} · Page {currentPage}/{totalPages}</p>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a] hover:bg-blue-100"><ChevronLeft aria-hidden="true" /> Previous / 上一页</Button>
              <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a] hover:bg-blue-100">Next / 下一页 <ChevronRight aria-hidden="true" /></Button>
            </div>
          </nav>
        </section>
      </div>
    </AppShell>
  );
}
