"use client";

import { History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WhoisHistoryEntry } from "@/features/settings/whois-history";

export function WhoisHistorySection({
  history,
  submitting,
  onClear,
  onSelect,
}: {
  history: WhoisHistoryEntry[];
  submitting: boolean;
  onClear: () => void;
  onSelect: (domain: string) => void;
}) {
  if (history.length === 0) return null;
  return (
    <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-black">
          <History className="size-3.5" />
          最近查询
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={onClear}
        >
          <Trash2 className="size-3.5" />
          清空
        </Button>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {history.map((item) => (
          <li key={`${item.domain}-${item.queriedAt}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-none px-2 text-xs"
              disabled={submitting}
              onClick={() => onSelect(item.domain)}
              title={item.status}
            >
              {item.domain}
              <span className="text-foreground/55">
                {item.registered ? "已注册" : "未注册"}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
