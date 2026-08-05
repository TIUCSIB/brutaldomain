import { Download, Layers3, Plus, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  DnsBatchTemplate,
  DnsTemplate,
} from "@/features/domains/dns-templates";
import { DNS_RECORD_TYPES, type DnsRecordType } from "@/features/domains/types";

export function DnsRecordsHeader({
  titleId,
  zoneDomain,
  recordCount,
  filteredCount,
  queryActive,
  sessionLabel,
  canWrite,
  exportDisabled,
  onExport,
  onImportClick,
  onAdd,
}: {
  titleId: string;
  zoneDomain: string;
  recordCount: number;
  filteredCount: number;
  queryActive: boolean;
  sessionLabel: string | null;
  canWrite: boolean;
  exportDisabled: boolean;
  onExport: () => void;
  onImportClick: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-b-2 border-border bg-main/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id={titleId} className="text-lg font-black">
          解析记录
        </h2>
        <p className="mt-0.5 text-xs font-bold text-foreground/70">
          {recordCount} 条记录 · {zoneDomain} · 实时同步 DNSHE
          {queryActive ? ` · 筛选 ${filteredCount}` : ""}
          {sessionLabel ? ` · ${sessionLabel}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={exportDisabled}
        >
          <Download aria-hidden="true" /> 导出
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onImportClick}
          disabled={!canWrite}
        >
          <Upload aria-hidden="true" /> 导入
        </Button>
        <Button type="button" size="sm" onClick={onAdd} disabled={!canWrite}>
          <Plus aria-hidden="true" /> 添加记录
        </Button>
      </div>
    </div>
  );
}

export function DnsRecordsFilters({
  canWrite,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  groupByType,
  onGroupByTypeChange,
  templates,
  batchTemplates,
  batchBusy,
  onOpenTemplate,
  onOpenBatch,
}: {
  canWrite: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: DnsRecordType | "all";
  onTypeFilterChange: (value: DnsRecordType | "all") => void;
  groupByType: boolean;
  onGroupByTypeChange: (value: boolean) => void;
  templates: readonly DnsTemplate[];
  batchTemplates: readonly DnsBatchTemplate[];
  batchBusy: boolean;
  onOpenTemplate: (id: string) => void;
  onOpenBatch: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b-2 border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-main"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索类型 / 名称 / 内容…"
            className="h-9 w-full rounded-none border-2 border-border bg-secondary-background pr-3 pl-8 text-xs font-bold shadow-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <select
            aria-label="按类型筛选"
            value={typeFilter}
            onChange={(event) =>
              onTypeFilterChange(event.target.value as DnsRecordType | "all")
            }
            className="h-9 rounded-none border-2 border-border bg-secondary-background px-2 text-xs font-bold shadow-shadow"
          >
            <option value="all">全部类型</option>
            {DNS_RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant={groupByType ? "default" : "outline"}
            className="h-9 rounded-none"
            onClick={() => onGroupByTypeChange(!groupByType)}
          >
            <Layers3 aria-hidden="true" className="size-3.5" />
            按类型分组
          </Button>
        </div>
      </div>
      {canWrite ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-black text-foreground/60">
              单条
            </span>
            {templates.map((template) => (
              <Button
                key={template.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-none px-2 text-[11px]"
                title={template.description}
                onClick={() => onOpenTemplate(template.id)}
              >
                {template.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-black text-foreground/60">
              批量
            </span>
            {batchTemplates.map((template) => (
              <Button
                key={template.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-none px-2 text-[11px]"
                title={template.description}
                disabled={batchBusy}
                onClick={() => onOpenBatch(template.id)}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
