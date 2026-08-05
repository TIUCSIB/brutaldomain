"use client";

import { useState } from "react";

import { toast } from "@/components/ui/sonner";
import { getDnsErrorHint } from "@/features/domains/dns-error-hints";
import {
  buildDnsImportDiff,
  parseDnsCsv,
  toCreateInput,
  type DnsImportDiffItem,
} from "@/features/domains/dns-import";
import type {
  CreateDnsRecordInput,
  DnsRecord,
  UpdateDnsRecordInput,
} from "@/features/domains/types";

export function useDnsImport({
  domainId,
  records,
  createRecord,
  updateRecord,
  onApplied,
}: {
  domainId: number;
  records: DnsRecord[];
  createRecord: (
    domainId: number | string,
    input: CreateDnsRecordInput,
  ) => Promise<DnsRecord>;
  updateRecord: (
    domainId: number | string,
    recordId: string,
    input: UpdateDnsRecordInput,
  ) => Promise<DnsRecord>;
  onApplied: (created: number, updated: number) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [importDiff, setImportDiff] = useState<DnsImportDiffItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importBusy, setImportBusy] = useState(false);

  function handleImportFile(text: string) {
    const parsed = parseDnsCsv(text);
    setImportErrors(parsed.errors);
    const diff = buildDnsImportDiff(parsed.rows, records);
    setImportDiff(diff);
    setImportOpen(true);
    if (parsed.rows.length === 0) {
      toast.error("未能解析有效记录", {
        description: parsed.errors[0] ?? "请检查 CSV 格式",
      });
    }
  }

  async function confirmImport() {
    const actionable = importDiff.filter(
      (item) => item.status === "create" || item.status === "update",
    );
    if (actionable.length === 0) {
      toast.error("没有可应用的变更");
      return;
    }
    setImportBusy(true);
    let created = 0;
    let updated = 0;
    const failures: string[] = [];
    try {
      for (const item of actionable) {
        try {
          if (item.status === "create") {
            await createRecord(domainId, toCreateInput(item.row));
            created += 1;
          } else if (item.existing) {
            await updateRecord(domainId, item.existing.id, {
              type: item.row.type,
              name: item.row.name,
              content: item.row.content,
              ttl: item.row.ttl,
              proxied: item.row.proxied,
              priority: item.row.priority ?? null,
            });
            updated += 1;
          }
        } catch (error) {
          failures.push(
            `${item.row.type} ${item.row.name}: ${getDnsErrorHint(error)}`,
          );
        }
      }
      if (created > 0 || updated > 0) onApplied(created, updated);
      if (failures.length === 0) {
        toast.success("CSV 导入完成", {
          description: `新增 ${created} · 更新 ${updated}`,
        });
        setImportOpen(false);
        setImportDiff([]);
      } else {
        toast.error(`部分失败（成功 ${created + updated}）`, {
          description: failures[0],
        });
      }
    } finally {
      setImportBusy(false);
    }
  }

  return {
    importOpen,
    setImportOpen,
    importDiff,
    importErrors,
    importBusy,
    handleImportFile,
    confirmImport,
  };
}
