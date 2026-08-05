"use client";

import { useMemo, useState, type FormEvent } from "react";

import { toast } from "@/components/ui/sonner";
import {
  dnsRecordsToCsv,
  downloadTextFile,
} from "@/features/domains/dns-export";
import { getDnsErrorHint } from "@/features/domains/dns-error-hints";
import { normalizeDnsRecordName } from "@/features/domains/dns-record-name";
import {
  applyDnsTemplate,
  DNS_BATCH_TEMPLATES,
  DNS_TEMPLATES,
} from "@/features/domains/dns-templates";
import type {
  CreateDnsRecordInput,
  DnsRecord,
  DnsRecordType,
  UpdateDnsRecordInput,
} from "@/features/domains/types";
import { useDnsImport } from "@/features/domains/use-dns-import";
import {
  emptyForm,
  formFromRecord,
  type RecordForm,
} from "@/components/dns-records-dialogs";

interface SessionSummary {
  created: number;
  updated: number;
  deleted: number;
}

export function useDnsRecordsController({
  domainId,
  zoneDomain,
  records,
  createRecord,
  updateRecord,
  deleteRecord,
}: {
  domainId: number;
  zoneDomain: string;
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
  deleteRecord: (domainId: number | string, recordId: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);
  const [form, setForm] = useState<RecordForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [session, setSession] = useState<SessionSummary>({
    created: 0,
    updated: 0,
    deleted: 0,
  });
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState<DnsRecordType | "all">("all");
  const [groupByType, setGroupByType] = useState(false);

  const importer = useDnsImport({
    domainId,
    records,
    createRecord,
    updateRecord,
    onApplied: (created, updated) => {
      setSession((current) => ({
        created: current.created + created,
        updated: current.updated + updated,
        deleted: current.deleted,
      }));
    },
  });

  const visibleRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((record) => {
      if (typeFilter !== "all" && record.type !== typeFilter) return false;
      if (!q) return true;
      return [record.type, record.name, record.content, String(record.ttl)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, records, typeFilter]);

  const groupedRecords = useMemo(() => {
    if (!groupByType) return null;
    const map = new Map<DnsRecordType, DnsRecord[]>();
    for (const record of visibleRecords) {
      const list = map.get(record.type) ?? [];
      list.push(record);
      map.set(record.type, list);
    }
    return [...map.entries()].sort((left, right) =>
      left[0].localeCompare(right[0]),
    );
  }, [groupByType, visibleRecords]);

  const pendingBatch = DNS_BATCH_TEMPLATES.find((item) => item.id === batchId);
  const sessionTotal = session.created + session.updated + session.deleted;
  const sessionLabel =
    sessionTotal > 0
      ? `本会话 +${session.created}/~${session.updated}/-${session.deleted}`
      : null;

  function openCreate(templateId?: string) {
    setEditingRecord(null);
    setFormError(null);
    const template = DNS_TEMPLATES.find((item) => item.id === templateId);
    setForm(
      template ? applyDnsTemplate(template, zoneDomain, emptyForm) : emptyForm,
    );
    setDialogOpen(true);
  }

  function openEdit(record: DnsRecord) {
    setEditingRecord(record);
    setFormError(null);
    setForm({
      ...formFromRecord(record),
      name: normalizeDnsRecordName(record.name, zoneDomain),
    });
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ttl = Number(form.ttl);
    const priority =
      form.priority.trim() === "" ? undefined : Number(form.priority);
    const name = normalizeDnsRecordName(form.name, zoneDomain);
    setSubmitting(true);
    setFormError(null);
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
        setSession((c) => ({ ...c, updated: c.updated + 1 }));
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
        setSession((c) => ({ ...c, created: c.created + 1 }));
        toast.success("DNS 记录已添加", { description: `${form.type} ${name}` });
      }
      setDialogOpen(false);
    } catch (error) {
      const message = getDnsErrorHint(error);
      setFormError(message);
      toast.error("保存失败", {
        description: `${message} · 表单内容已保留，可修改后重试`,
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
      setSession((c) => ({ ...c, deleted: c.deleted + 1 }));
      toast.success("DNS 记录已删除", {
        description: `${deleteTarget.type} ${deleteTarget.name}`,
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("删除失败", { description: getDnsErrorHint(error) });
    } finally {
      setDeleting(false);
    }
  }

  async function confirmBatchApply() {
    if (!pendingBatch) return;
    const inputs = pendingBatch.build(zoneDomain);
    setBatchBusy(true);
    let success = 0;
    const failures: string[] = [];
    try {
      for (const input of inputs) {
        try {
          await createRecord(domainId, input);
          success += 1;
        } catch (error) {
          failures.push(`${input.type} ${input.name}: ${getDnsErrorHint(error)}`);
        }
      }
      if (success > 0) setSession((c) => ({ ...c, created: c.created + success }));
      if (failures.length === 0) {
        toast.success(`已应用「${pendingBatch.label}」`, {
          description: `新增 ${success} 条`,
        });
      } else {
        toast.error(`部分失败（成功 ${success}/${inputs.length}）`, {
          description: failures[0],
        });
      }
      setBatchId(null);
    } finally {
      setBatchBusy(false);
    }
  }

  function handleExport() {
    const source =
      query.trim() || typeFilter !== "all" ? visibleRecords : records;
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

  return {
    templates: DNS_TEMPLATES,
    batchTemplates: DNS_BATCH_TEMPLATES,
    dialogOpen,
    setDialogOpen: handleDialogOpenChange,
    editingRecord,
    deleteTarget,
    setDeleteTarget,
    form,
    setForm,
    formError,
    submitting,
    deleting,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    groupByType,
    setGroupByType,
    batchId,
    setBatchId,
    batchBusy,
    visibleRecords,
    groupedRecords,
    pendingBatch,
    sessionLabel,
    ...importer,
    openCreate,
    openEdit,
    handleSubmit,
    confirmDelete,
    confirmBatchApply,
    handleExport,
  };
}
