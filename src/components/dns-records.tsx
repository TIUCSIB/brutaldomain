"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { normalizeDnsRecordName } from "@/features/domains/dns-record-name";
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

  function openCreate() {
    setEditingRecord(null);
    setForm(emptyForm);
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
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          disabled={!canWrite}
        >
          <Plus aria-hidden="true" /> 添加记录
        </Button>
      </div>
      {!canWrite ? (
        <div className="border-b-2 border-border bg-[#fff7d6] px-3 py-2 text-xs font-bold text-foreground/80">
          当前数据可查看，但 DNS 写入已关闭。
        </div>
      ) : null}

      <DnsRecordsView
        canWrite={canWrite}
        domainId={domainId}
        onDelete={setDeleteTarget}
        onEdit={openEdit}
        records={records}
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
