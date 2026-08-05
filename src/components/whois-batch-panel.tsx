"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function WhoisBatchPanel({
  batchText,
  onBatchTextChange,
  batchBusy,
  batchLog,
  onRun,
}: {
  batchText: string;
  onBatchTextChange: (value: string) => void;
  batchBusy: boolean;
  batchLog: string[];
  onRun: () => void;
}) {
  return (
    <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
      <Label htmlFor="whois-batch" className="text-xs">
        批量域名（每行一个，最多 20）
      </Label>
      <textarea
        id="whois-batch"
        value={batchText}
        onChange={(event) => onBatchTextChange(event.target.value)}
        rows={5}
        className="mt-1 w-full rounded-none border-2 border-border bg-background p-2 font-mono text-xs font-bold shadow-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={"example.com\nexample.org"}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={batchBusy} onClick={onRun}>
          {batchBusy ? "队列执行中…" : "开始批量查询"}
        </Button>
      </div>
      {batchLog.length > 0 ? (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-2 border-border p-2 text-[11px] font-bold">
          {batchLog.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function WhoisDiffPanel({
  lines,
}: {
  lines: { field: string; before: string; after: string }[];
}) {
  if (lines.length === 0) return null;
  return (
    <section className="border-2 border-border bg-[#fff7d6] p-3.5 shadow-shadow">
      <h2 className="text-sm font-black">与上次查询差异</h2>
      <ul className="mt-2 space-y-1 text-xs font-bold">
        {lines.map((line) => (
          <li key={line.field}>
            <span className="text-foreground/60">{line.field}：</span>
            <span className="line-through opacity-70">{line.before}</span>
            {" → "}
            <span>{line.after}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
