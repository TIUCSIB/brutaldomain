"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  RefreshCw,
} from "lucide-react";

import { ConfigErrorBanner } from "@/components/config-error-banner";
import {
  AttentionCard,
  DashboardQuickLinks,
} from "@/components/dashboard-attention";
import {
  ProviderBarChart,
  RiskDonutChart,
  StatusBarChart,
} from "@/components/dashboard-charts";
import { DashboardQuotaChip } from "@/components/dashboard-quota-chip";
import {
  buildWeekTodos,
  DashboardWeekTodo,
} from "@/components/dashboard-week-todo";
import { DashboardSkeleton } from "@/components/page-skeletons";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  getErrorMessage,
  getExpiryDays,
  isExpiringWithin,
} from "@/features/domains/utils";
import { useSettingsStore } from "@/features/settings/settings-store";

export function DashboardOverview() {
  const { domains, error, hydrated, initialized, loading, refreshDomains } =
    useDomainStore();
  const {
    quota,
    initialized: settingsInitialized,
    refreshSettings,
  } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const statusCounts = {
      Registered: 0,
      Pending: 0,
      Suspended: 0,
      Expired: 0,
      Error: 0,
    };
    let expiring = 0;
    let neverExpires = 0;
    let expired = 0;
    const providerMap = new Map<number, number>();

    for (const domain of domains) {
      statusCounts[domain.status] += 1;
      if (domain.never_expires === 1) neverExpires += 1;
      const days = getExpiryDays(domain);
      if (days !== null && days < 0) expired += 1;
      else if (isExpiringWithin(domain)) expiring += 1;
      if (domain.provider_account_id !== null) {
        providerMap.set(
          domain.provider_account_id,
          (providerMap.get(domain.provider_account_id) ?? 0) + 1,
        );
      }
    }

    const providers = [...providerMap.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count || a.id - b.id);

    const attention = [...domains]
      .filter((domain) => {
        if (domain.status === "Expired" || domain.status === "Error")
          return true;
        const days = getExpiryDays(domain);
        return days !== null && days <= 90;
      })
      .sort((left, right) => {
        const leftDays = getExpiryDays(left) ?? Number.MAX_SAFE_INTEGER;
        const rightDays = getExpiryDays(right) ?? Number.MAX_SAFE_INTEGER;
        return leftDays - rightDays;
      })
      .slice(0, 5);

    const healthy = Math.max(
      0,
      domains.length - expiring - expired - neverExpires,
    );

    return {
      total: domains.length,
      registered: statusCounts.Registered,
      expiring,
      expired,
      neverExpires,
      healthy,
      providers: providers.length,
      statusData: [
        { key: "registered", label: "已注册", count: statusCounts.Registered },
        { key: "pending", label: "待处理", count: statusCounts.Pending },
        { key: "suspended", label: "已暂停", count: statusCounts.Suspended },
        { key: "expired", label: "已过期", count: statusCounts.Expired },
        { key: "error", label: "异常", count: statusCounts.Error },
      ],
      riskData: [
        { key: "healthy", label: "健康", count: healthy },
        { key: "never", label: "永不过期", count: neverExpires },
        { key: "expiring", label: "90天内到期", count: expiring },
        { key: "riskExpired", label: "已过期", count: expired },
      ].filter((item) => item.count > 0),
      providerData: providers.slice(0, 5).map((row) => ({
        provider: `#${row.id}`,
        providerId: row.id,
        count: row.count,
      })),
      attention,
      weekTodos: buildWeekTodos(domains),
    };
  }, [domains]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshDomains(), refreshSettings({ force: true })]);
      toast.success("域名与配额已同步");
    } catch (caught) {
      toast.error("同步失败", { description: getErrorMessage(caught) });
    } finally {
      setRefreshing(false);
    }
  }

  if (!hydrated || (!initialized && loading && domains.length === 0)) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-block -rotate-1 border-2 border-border bg-[#ffd84d] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] shadow-shadow">
              控制台总览
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              域名控制中心
            </h1>
            <p className="mt-1.5 max-w-xl text-sm font-bold text-foreground/70">
              健康度与分布速览 · 清单请到「域名」页
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button asChild size="sm">
              <Link href="/domains">
                域名清单 <ArrowRight />
              </Link>
            </Button>
          </div>
        </header>

        <ConfigErrorBanner error={error} />

        <section
          aria-label="域名统计"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            compact
            title="总域名"
            value={stats.total}
            description={
              !hydrated || !initialized ? "加载中…" : "全部托管域名"
            }
            icon={Globe2}
            tone="blue"
          />
          <StatCard
            compact
            title="已注册"
            value={stats.registered}
            description={`${stats.total === 0 ? 0 : Math.round((stats.registered / stats.total) * 100)}% 注册正常`}
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            compact
            title="90 天内到期"
            value={stats.expiring}
            description={
              stats.expired > 0
                ? `另有 ${stats.expired} 个已过期`
                : "需要关注"
            }
            icon={AlertTriangle}
            tone="yellow"
          />
          <StatCard
            compact
            title="服务商"
            value={stats.providers}
            description="独立服务商账户"
            icon={Building2}
            tone="neutral"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardWeekTodo items={stats.weekTodos} />
          <DashboardQuotaChip
            quota={quota}
            initialized={settingsInitialized}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <StatusBarChart data={stats.statusData} />
          <RiskDonutChart data={stats.riskData} total={stats.total} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr]">
          <AttentionCard domains={stats.attention} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ProviderBarChart data={stats.providerData} />
            <DashboardQuickLinks />
          </div>
        </section>
    </div>
  );
}
