"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

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
  search: string;
  status: StatusFilter;
  provider: ProviderFilter;
  expiryRisk: ExpiryRiskFilter;
  sort: DomainSort;
  providers: number[];
  active: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onProviderChange: (value: ProviderFilter) => void;
  onExpiryRiskChange: (value: ExpiryRiskFilter) => void;
  onSortChange: (value: DomainSort) => void;
  onReset: () => void;
}

const triggerClassName =
  "h-9 w-full rounded-none border-2 border-border bg-secondary-background text-sm text-foreground shadow-shadow";
const contentClassName =
  "rounded-none border-2 border-border bg-secondary-background text-foreground shadow-shadow";

export function DomainFilters({
  search,
  status,
  provider,
  expiryRisk,
  sort,
  providers,
  active,
  onSearchChange,
  onStatusChange,
  onProviderChange,
  onExpiryRiskChange,
  onSortChange,
  onReset,
}: DomainFiltersProps) {
  return (
    <section
      aria-labelledby="domain-filter-title"
      className="border-2 border-border bg-main/10 p-3 shadow-shadow"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="domain-filter-title"
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em]"
        >
          <SlidersHorizontal
            aria-hidden="true"
            className="size-3.5 text-main"
            strokeWidth={3}
          />
          筛选
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!active && !search.trim()}
        >
          <RotateCcw aria-hidden="true" /> 重置
        </Button>
      </div>

      <div className="mb-2.5 max-w-sm" role="search">
        <Label htmlFor="domain-search" className="sr-only">
          搜索域名
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-main"
            strokeWidth={2.5}
          />
          <input
            id="domain-search"
            type="search"
            autoComplete="off"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索域名、ID、服务商…"
            className="h-9 w-full rounded-none border-2 border-border bg-secondary-background pl-9 pr-3 text-sm font-bold text-foreground shadow-shadow outline-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="status-filter" className="text-xs">
            状态
          </Label>
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as StatusFilter)}
          >
            <SelectTrigger id="status-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">全部状态</SelectItem>
              {DOMAIN_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="provider-filter" className="text-xs">
            服务商
          </Label>
          <Select
            value={String(provider)}
            onValueChange={(value) =>
              onProviderChange(value === "all" ? "all" : Number(value))
            }
          >
            <SelectTrigger id="provider-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">全部服务商</SelectItem>
              {providers.map((id) => (
                <SelectItem key={id} value={String(id)}>
                  服务商 #{id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="risk-filter" className="text-xs">
            到期风险
          </Label>
          <Select
            value={expiryRisk}
            onValueChange={(value) =>
              onExpiryRiskChange(value as ExpiryRiskFilter)
            }
          >
            <SelectTrigger id="risk-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="all">全部风险</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
              <SelectItem value="within-90">90 天内到期</SelectItem>
              <SelectItem value="healthy">状态正常</SelectItem>
              <SelectItem value="never">永不过期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sort-filter" className="text-xs">
            排序
          </Label>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as DomainSort)}
          >
            <SelectTrigger id="sort-filter" className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
              <SelectItem value="expiry-asc">到期时间升序</SelectItem>
              <SelectItem value="expiry-desc">到期时间降序</SelectItem>
              <SelectItem value="created-desc">最新创建</SelectItem>
              <SelectItem value="created-asc">最早创建</SelectItem>
              <SelectItem value="domain-asc">域名 A–Z</SelectItem>
              <SelectItem value="domain-desc">域名 Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
