"use client";

import { useMemo, useState, type FormEvent } from "react";

import { toast } from "@/components/ui/sonner";
import {
  dnsRecordsToCsv,
  downloadTextFile,
} from "@/features/domains/dns-export";
import { normalizeDnsRecordName } from "@/features/domains/dns-record-name";
import {
  applyDnsTemplate,
  DNS_BATCH_TEMPLATES,
  DNS_TEMPLATES,
} from "@/features/domains/dns-templates";
import type {
  CreateDnsRecordInput,
  DnsRecord,
  UpdateDnsRecordInput,
} from "@/features/domains/types";
import { getErrorMessage } from "@/features/domains/utils";
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

  const pendingBatch = DNS_BATCH_TEMPLATES.find((item) => item.id === batchId);
  const sessionTotal = session.created + session.updated + session.deleted;
  const sessionLabel =
    sessionTotal > 0
      ? `本会话 +${session.created}/~${session.updated}/-${session.deleted}`
      : null;

  function openCreate(templateId?: string) {
    setEditingRecord(null);
    const template = DNS_TEMPLATES.find((item) => item.id === templateId);
    setForm(
      template ? applyDnsTemplate(template, zoneDomain, emptyForm) : emptyForm,
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
    const priority =
      form.priority.trim() === "" ? undefined : Number(form.priority);
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
        setSession((current) => ({
          ...current,
          updated: current.updated + 1,
        }));
        toast.success("DNS 记录已更新", {
          description: `${form.type} ${name}`,
        });
      } else {
        await createRecord(domainId, {
          type: form.type,
          name,
          content: form.content,
          ttl,
          proxied: form.proxied,
          ...(priority === undefined ? {} : { priority }),
        });
        setSession((current) => ({
          ...current,
          created: current.created + 1,
        }));
        toast.success("DNS 记录已添加", {
          description: `${form.type} ${name}`,
        });
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
      setSession((current) => ({
        ...current,
        deleted: current.deleted + 1,
      }));
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
          failures.push(
            `${input.type} ${input.name}: ${getErrorMessage(error)}`,
          );
        }
      }
      if (success > 0) {
        setSession((current) => ({
          ...current,
          created: current.created + success,
        }));
      }
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

  return {
    templates: DNS_TEMPLATES,
    batchTemplates: DNS_BATCH_TEMPLATES,
    dialogOpen,
    setDialogOpen,
    editingRecord,
    deleteTarget,
    setDeleteTarget,
    form,
    setForm,
    submitting,
    deleting,
    query,
    setQuery,
    batchId,
    setBatchId,
    batchBusy,
    visibleRecords,
    pendingBatch,
    sessionLabel,
    openCreate,
    openEdit,
    handleSubmit,
    confirmDelete,
    confirmBatchApply,
    handleExport,
  };
}
