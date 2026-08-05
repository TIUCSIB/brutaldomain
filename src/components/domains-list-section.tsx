import { DomainListEmpty } from "@/components/domain-list-empty";
import { DomainListPagination } from "@/components/domain-list-pagination";
import { DomainMobileList } from "@/components/domain-mobile-list";
import { DomainTable } from "@/components/domain-table";
import type { DomainColumnPrefs } from "@/features/domains/domain-list-prefs";
import type { PageSize } from "@/features/domains/domain-list-params";
import type { Subdomain } from "@/features/domains/types";

export function DomainsListSection({
  filteredCount,
  search,
  initialized,
  visibleDomains,
  selectedIds,
  columns,
  error,
  filtersActive,
  canCreate,
  rangeStart,
  rangeEnd,
  currentPage,
  totalPages,
  pageSize,
  onToggleSelect,
  onToggleSelectAll,
  onReset,
  onPageSizeChange,
  onPrev,
  onNext,
}: {
  filteredCount: number;
  search: string;
  initialized: boolean;
  visibleDomains: Subdomain[];
  selectedIds: ReadonlySet<number>;
  columns: DomainColumnPrefs;
  error: string | null;
  filtersActive: boolean;
  canCreate: boolean;
  rangeStart: number;
  rangeEnd: number;
  currentPage: number;
  totalPages: number;
  pageSize: PageSize;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onReset: () => void;
  onPageSizeChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <section aria-labelledby="domain-list-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="domain-list-title"
            className="text-lg font-black tracking-tight"
          >
            域名清单
          </h2>
          <p
            aria-live="polite"
            className="mt-0.5 text-xs font-bold text-foreground/70"
          >
            {!initialized ? "正在加载域名…" : `${filteredCount} 条结果`}
            {search ? ` · 搜索 “${search}”` : ""}
          </p>
        </div>
      </div>

      {visibleDomains.length > 0 ? (
        <>
          <DomainTable
            domains={visibleDomains}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleSelectAll={onToggleSelectAll}
            columns={columns}
          />
          <DomainMobileList
            domains={visibleDomains}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
          />
        </>
      ) : (
        <DomainListEmpty
          error={error}
          filtersActive={filtersActive}
          canCreate={canCreate}
          onReset={onReset}
        />
      )}

      <DomainListPagination
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={filteredCount}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        onPrev={onPrev}
        onNext={onNext}
      />
    </section>
  );
}
