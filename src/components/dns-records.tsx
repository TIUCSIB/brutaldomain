"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Download, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  dnsRecordsToCsv,
  downloadTextFile,
} from "@/features/domains/dns-export";
import { normalizeDnsRecordName } from "@/features/domains/dns-record-name";
import {
  applyDnsTemplate,
  DNS_TEMPLATES,
} from "@/features/domains/dns-templates";
import type {
  CreateDnsRecordInput,
  DnsRecord,
  UpdateDnsRecordInput,
} from "@/features/domains/types";
import { getErrorMessage } from "@/features/domains/utils";

import { RecordDeleteDialog } from "./dns-record-delete-dialog";
import {
  emptyForm,
  formFromRecord,
  RecordEditorDialog,
  type RecordForm,
} from "./dns-records-dialogs";
import { DnsRecordsView } from "./dns-records-view";

interface DnsRecordsProps {
  domainId: number;
  zoneDomain: string;
  records: DnsRecord[];
  canWrite: boolean;
  proxyEditing: boolean;
  createRecord: (
    domainId: number | string,
    input: CreateDnsRecordInput,
  ) => Promise<DnsRecord>;
  updateRecord: (
    domainId: number | string,
    recordId: string,
    input: UpdateDnsRecordInput,
  ) => Promise<DnsRecord>;
  deleteRecord: (domainId: number | string, recordId: string) => Promise<void>;
}

export function DnsRecords({
  canWrite,
  createRecord,
  deleteRecord,
  domainId,
  proxyEditing,
  records,
  updateRecord,
  zoneDomain,
}: DnsRecordsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);
  const [form, setForm] = useState<RecordForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");

  const visibleRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) =>
      [record.type, record.name, record.content, String(record.ttl)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, records]);

  function openCreate(templateId?: string) {
    setEditingRecord(null);
    const template = DNS_TEMPLATES.find((item) => item.id === templateId);
    setForm(
      template
        ? applyDnsTemplate(template, zoneDomain, emptyForm)
        : emptyForm,
    );
    setDialogOpen(true);
  }

  function openEdit(record: DnsRecord) {
    setEditingRecord(record);
    setForm({
      ...formFromRecord(record),
      name: normalizeDnsRecordName(record.name, zoneDomain),
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ttl = Number(form.ttl);
    const priority = form.priority.trim() === "" ? undefined : Number(form.priority);
    const name = normalizeDnsRecordName(form.name, zoneDomain);
    setSubmitting(true);

    try {
      if (editingRecord) {
        await updateRecord(domainId, editingRecord.id, {
          type: form.type,
          name,
          content: form.content,
          ttl,
          proxied: form.proxied,
          priority: priority ?? null,
        });
        toast.success("DNS 记录已更新", { description: `${form.type} ${name}` });
      } else {
        await createRecord(domainId, {
          type: form.type,
          name,
          content: form.content,
          ttl,
          proxied: form.proxied,
          ...(priority === undefined ? {} : { priority }),
        });
        toast.success("DNS 记录已添加", { description: `${form.type} ${name}` });
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("保存失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(domainId, deleteTarget.id);
      toast.success("DNS 记录已删除", {
        description: `${deleteTarget.type} ${deleteTarget.name}`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("删除失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const source = query.trim() ? visibleRecords : records;
    if (source.length === 0) {
      toast.error("没有可导出的记录");
      return;
    }
    downloadTextFile(
      `dns-${zoneDomain}-${new Date().toISOString().slice(0, 10)}.csv`,
      dnsRecordsToCsv(source),
    );
    toast.success(`已导出 ${source.length} 条 DNS 记录`);
  }

  return (
    <section
      aria-labelledby="dns-records-title"
      className="border-2 border-border bg-secondary-background shadow-shadow"
    >
      <div className="flex flex-col gap-2.5 border-b-2 border-border bg-main/10 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="dns-records-title" className="text-lg font-black">
            解析记录
          </h2>
          <p className="mt-0.5 text-xs font-bold text-foreground/70">
            {records.length} 条记录 · {zoneDomain} · 实时同步 DNSHE
            {query.trim() ? ` · 筛选 ${visibleRecords.length}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={records.length === 0}
          >
            <Download aria-hidden="true" /> 导出
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openCreate()}
            disabled={!canWrite}
          >
            <Plus aria-hidden="true" /> 添加记录
          </Button>
        </div>
      </div>
      {!canWrite ? (
        <div className="border-b-2 border-border bg-[#fff7d6] px-3 py-2 text-xs font-bold text-foreground/80">
          当前数据可查看，但 DNS 写入已关闭。
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-b-2 border-border p-3">
        <div className="relative max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-main"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索类型 / 名称 / 内容…"
            className="h-9 w-full rounded-none border-2 border-border bg-secondary-background pl-8 pr-3 text-xs font-bold shadow-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[11px] font-black text-foreground/60">
              模板
            </span>
            {DNS_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-none px-2 text-[11px]"
                title={template.description}
                onClick={() => openCreate(template.id)}
              >
                {template.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <DnsRecordsView
        canWrite={canWrite}
        domainId={domainId}
        onDelete={setDeleteTarget}
        onEdit={openEdit}
        records={visibleRecords}
      />
      <RecordEditorDialog
        editingRecord={editingRecord}
        form={form}
        onChange={setForm}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
        proxyEditing={proxyEditing}
        submitting={submitting}
        zoneDomain={zoneDomain}
      />
      <RecordDeleteDialog
        deleting={deleting}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        record={deleteTarget}
        zoneDomain={zoneDomain}
      />
    </section>
  );
}
