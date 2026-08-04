"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { DomainSource } from "@/features/domains/types";
import {
  type CreateDnsRecordInput,
  type DnsRecord,
  type UpdateDnsRecordInput,
} from "@/features/domains/types";
import { getErrorMessage } from "@/features/domains/utils";

import {
  emptyForm,
  formFromRecord,
  RecordDeleteDialog,
  RecordEditorDialog,
  type RecordForm,
} from "./dns-records-dialogs";
import { DnsRecordsView } from "./dns-records-view";

interface DnsRecordsProps {
  domainId: number;
  records: DnsRecord[];
  source: DomainSource;
  canWrite: boolean;
  proxyEditing: boolean;
  createRecord: (domainId: number | string, input: CreateDnsRecordInput) => Promise<DnsRecord>;
  updateRecord: (domainId: number | string, recordId: string, input: UpdateDnsRecordInput) => Promise<DnsRecord>;
  deleteRecord: (domainId: number | string, recordId: string) => Promise<void>;
}

export function DnsRecords({ canWrite, createRecord, deleteRecord, domainId, proxyEditing, records, source, updateRecord }: DnsRecordsProps) {
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
    setForm(formFromRecord(record));
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ttl = Number(form.ttl);
    const priority = form.priority.trim() === "" ? undefined : Number(form.priority);
    setSubmitting(true);

    try {
      if (editingRecord) {
        await updateRecord(domainId, editingRecord.id, { type: form.type, name: form.name, content: form.content, ttl, proxied: form.proxied, priority: priority ?? null });
        toast.success("DNS 记录已更新", { description: `${form.type} ${form.name}` });
      } else {
        await createRecord(domainId, { type: form.type, name: form.name, content: form.content, ttl, proxied: form.proxied, ...(priority === undefined ? {} : { priority }) });
        toast.success("DNS 记录已添加", { description: `${form.type} ${form.name}` });
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Unable to save / 保存失败", { description: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(domainId, deleteTarget.id);
      toast.success("DNS 记录已删除", { description: `${deleteTarget.type} ${deleteTarget.name}` });
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Unable to delete / 删除失败", { description: getErrorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="dns-records-title" className="border-2 border-slate-950 bg-white shadow-[5px_5px_0_0_#0f172a]">
      <div className="flex flex-col gap-4 border-b-2 border-slate-950 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 id="dns-records-title" className="text-xl font-black">DNS Records / 解析记录</h2><p className="mt-1 text-sm font-bold text-slate-600">{records.length} records · {source === "dnshe" ? "Live DNSHE sync" : "Local demo mode"}</p></div><Button type="button" onClick={openCreate} disabled={!canWrite} className="rounded-none border-slate-950 bg-[#1261ff] text-white shadow-[3px_3px_0_0_#0f172a] hover:bg-[#0b46c4] disabled:bg-slate-300 disabled:text-slate-700"><Plus aria-hidden="true" /> Add record / 添加</Button></div>
      {!canWrite ? <div className="border-b-2 border-slate-950 bg-[#fff7d6] px-4 py-3 text-sm font-bold text-slate-700 sm:px-5">当前数据可查看，但 DNS 写入已关闭。</div> : null}

      <DnsRecordsView canWrite={canWrite} domainId={domainId} onDelete={setDeleteTarget} onEdit={openEdit} records={records} />
      <RecordEditorDialog editingRecord={editingRecord} form={form} onChange={setForm} onOpenChange={setDialogOpen} onSubmit={handleSubmit} open={dialogOpen} proxyEditing={proxyEditing} submitting={submitting} />
      <RecordDeleteDialog deleting={deleting} onConfirm={confirmDelete} onOpenChange={(open) => !open && setDeleteTarget(null)} record={deleteTarget} />
    </section>
  );
}
