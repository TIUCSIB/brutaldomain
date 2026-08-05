"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DnsImportDiffItem } from "@/features/domains/dns-import";

export function DnsImportDialog({
  open,
  onOpenChange,
  diff,
  errors,
  pending,
  onPickFile,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: DnsImportDiffItem[];
  errors: string[];
  pending: boolean;
  onPickFile: (text: string) => void;
  onConfirm: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const createCount = diff.filter((item) => item.status === "create").length;
  const updateCount = diff.filter((item) => item.status === "update").length;
  const skipCount = diff.filter((item) => item.status === "skip").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-none border-2 border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入 DNS CSV</DialogTitle>
          <DialogDescription>
            支持列：type, name, content, ttl, proxied, priority。应用前可预览 diff。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                onPickFile(String(reader.result ?? ""));
              };
              reader.readAsText(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            选择 CSV 文件
          </Button>

          {errors.length > 0 ? (
            <div className="border-2 border-border bg-[#fff0f3] px-2.5 py-2 text-xs font-bold text-red-700">
              {errors.slice(0, 4).map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          {diff.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-black">
                预览：新增 {createCount} · 更新 {updateCount} · 跳过 {skipCount}
              </p>
              <ul className="max-h-56 space-y-1.5 overflow-y-auto border-2 border-border p-2">
                {diff.slice(0, 40).map((item, index) => (
                  <li
                    key={`${item.row.type}-${item.row.name}-${index}`}
                    className="text-[11px] font-bold"
                  >
                    <span
                      className={
                        item.status === "create"
                          ? "text-emerald-700"
                          : item.status === "update"
                            ? "text-amber-800"
                            : "text-foreground/55"
                      }
                    >
                      {item.status === "create"
                        ? "新增"
                        : item.status === "update"
                          ? "更新"
                          : "跳过"}
                    </span>{" "}
                    {item.row.type} {item.row.name} → {item.row.content}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-bold text-foreground/70">
              选择文件后将显示变更预览。
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || createCount + updateCount === 0}
            onClick={onConfirm}
          >
            {pending ? "导入中…" : "应用变更"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
