"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@/features/domains/domain-list-params";

interface DomainListPaginationProps {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: PageSize;
  onPageSizeChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function DomainListPagination({
  rangeStart,
  rangeEnd,
  total,
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrev,
  onNext,
}: DomainListPaginationProps) {
  return (
    <nav
      aria-label="域名分页"
      className="flex flex-col gap-2 border-2 border-border bg-secondary-background p-2.5 shadow-shadow sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-center text-xs font-bold text-foreground/70 sm:text-left">
        显示 {rangeStart}–{rangeEnd} / 共 {total} 条 · 第 {currentPage}/
        {totalPages} 页
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-xs font-bold text-foreground/80">
          <span>每页</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
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
          onClick={onPrev}
        >
          <ChevronLeft aria-hidden="true" /> 上一页
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={onNext}
        >
          下一页 <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
