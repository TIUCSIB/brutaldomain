"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAIN_STATUSES } from "@/features/domains/types";
import type {
  DomainSort,
  ExpiryRiskFilter,
  ProviderFilter,
  StatusFilter,
} from "@/features/domains/utils";

export interface DomainFiltersProps {
  status: StatusFilter;
  provider: ProviderFilter;
  expiryRisk: ExpiryRiskFilter;
  sort: DomainSort;
  providers: number[];
  active: boolean;
  onStatusChange: (value: StatusFilter) => void;
  onProviderChange: (value: ProviderFilter) => void;
  onExpiryRiskChange: (value: ExpiryRiskFilter) => void;
  onSortChange: (value: DomainSort) => void;
  onReset: () => void;
}

const triggerClassName = "h-11 w-full rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[3px_3px_0_0_#0f172a] focus:ring-blue-300";
const contentClassName = "rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_0_#0f172a]";

export function DomainFilters({
  status,
  provider,
  expiryRisk,
  sort,
  providers,
  active,
  onStatusChange,
  onProviderChange,
  onExpiryRiskChange,
  onSortChange,
  onReset,
}: DomainFiltersProps) {
  return (
    <section aria-labelledby="domain-filter-title" className="border-2 border-slate-950 bg-blue-100 p-4 shadow-[4px_4px_0_0_#0f172a]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="domain-filter-title" className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
          <SlidersHorizontal aria-hidden="true" className="size-5 text-blue-700" strokeWidth={3} />
          Filters / 筛选
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!active}
          className="rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[2px_2px_0_0_#0f172a] hover:bg-[#ffd84d]"
        >
          <RotateCcw aria-hidden="true" /> Reset / 重置
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status / 状态</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as StatusFilter)}>
            <SelectTrigger id="status-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">All statuses / 全部</SelectItem>
              {DOMAIN_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-filter">Provider / 服务商</Label>
          <Select value={String(provider)} onValueChange={(value) => onProviderChange(value === "all" ? "all" : Number(value))}>
            <SelectTrigger id="provider-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">All providers / 全部</SelectItem>
              {providers.map((id) => <SelectItem key={id} value={String(id)}>Provider #{id}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="risk-filter">Expiry risk / 到期风险</Label>
          <Select value={expiryRisk} onValueChange={(value) => onExpiryRiskChange(value as ExpiryRiskFilter)}>
            <SelectTrigger id="risk-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">All risk levels / 全部</SelectItem>
              <SelectItem value="expired">Expired / 已过期</SelectItem>
              <SelectItem value="within-90">Within 90 days / 90 天内</SelectItem>
              <SelectItem value="healthy">Healthy / 安全</SelectItem>
              <SelectItem value="never">Never expires / 永不过期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-filter">Sort by / 排序</Label>
          <Select value={sort} onValueChange={(value) => onSortChange(value as DomainSort)}>
            <SelectTrigger id="sort-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="expiry-asc">Expiry ↑ / 到期升序</SelectItem>
              <SelectItem value="expiry-desc">Expiry ↓ / 到期降序</SelectItem>
              <SelectItem value="created-desc">Newest created / 最新创建</SelectItem>
              <SelectItem value="created-asc">Oldest created / 最早创建</SelectItem>
              <SelectItem value="domain-asc">Domain A–Z</SelectItem>
              <SelectItem value="domain-desc">Domain Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
