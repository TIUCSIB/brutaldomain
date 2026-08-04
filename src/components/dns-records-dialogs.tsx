"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DNS_RECORD_TYPES, type DnsRecord, type DnsRecordType } from "@/features/domains/types";

export type RecordForm = {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
  priority: string;
};

export const emptyForm: RecordForm = {
  type: "A",
  name: "@",
  content: "",
  ttl: "3600",
  proxied: false,
  priority: "",
};

export function formFromRecord(record: DnsRecord): RecordForm {
  return {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: String(record.ttl),
    proxied: record.proxied,
    priority: record.priority === undefined ? "" : String(record.priority),
  };
}

interface RecordEditorDialogProps {
  editingRecord: DnsRecord | null;
  form: RecordForm;
  onChange: (form: RecordForm) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  proxyEditing: boolean;
  submitting: boolean;
}

export function RecordEditorDialog({ editingRecord, form, onChange, onOpenChange, onSubmit, open, proxyEditing, submitting }: RecordEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-none border-slate-950 bg-white text-slate-950 shadow-[7px_7px_0_0_#0f172a]">
        <DialogHeader><DialogTitle>{editingRecord ? "Edit DNS record / 编辑记录" : "Add DNS record / 添加记录"}</DialogTitle><DialogDescription>Configure the record values below. Required fields are marked.</DialogDescription></DialogHeader>
        <form id="dns-record-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2"><Label htmlFor="dns-type" className="font-black">Type / 类型</Label><Select value={form.type} onValueChange={(value: DnsRecordType) => onChange({ ...form, type: value })}><SelectTrigger id="dns-type" className="w-full rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"><SelectValue /></SelectTrigger><SelectContent className="rounded-none border-slate-950 bg-white">{DNS_RECORD_TYPES.map((type) => <SelectItem key={type} value={type} className="rounded-none">{type}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label htmlFor="dns-name" className="font-black">Name / 名称 *</Label><Input id="dns-name" required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="@ or www" className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]" /></div>
          <div className="grid gap-2"><Label htmlFor="dns-content" className="font-black">Content / 内容 *</Label><Input id="dns-content" required value={form.content} onChange={(event) => onChange({ ...form, content: event.target.value })} placeholder="192.0.2.1" className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="dns-ttl" className="font-black">TTL (seconds)</Label><Input id="dns-ttl" type="number" min="1" step="1" required value={form.ttl} onChange={(event) => onChange({ ...form, ttl: event.target.value })} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]" /></div><div className="grid gap-2"><Label htmlFor="dns-priority" className="font-black">Priority / 优先级</Label><Input id="dns-priority" type="number" min="0" step="1" value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value })} placeholder="Optional" className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]" /></div></div>
          <label className="flex cursor-pointer items-center gap-3 border-2 border-slate-950 bg-blue-50 p-3 font-black"><input type="checkbox" checked={form.proxied} disabled={!proxyEditing} onChange={(event) => onChange({ ...form, proxied: event.target.checked })} className="size-5 accent-[#1261ff]" />{proxyEditing ? "Cloudflare proxy / 开启代理" : "Proxy flag is read-only in DNSHE mode / 代理状态当前只读"}</label>
        </form>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]">Cancel / 取消</Button><Button type="submit" form="dns-record-form" disabled={submitting} className="rounded-none border-slate-950 bg-[#1261ff] text-white shadow-[2px_2px_0_0_#0f172a]">{submitting ? "Saving…" : editingRecord ? "Save changes / 保存" : "Add record / 添加"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RecordDeleteDialogProps {
  deleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  record: DnsRecord | null;
}

export function RecordDeleteDialog({ deleting, onConfirm, onOpenChange, record }: RecordDeleteDialogProps) {
  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-slate-950 bg-white text-slate-950 shadow-[7px_7px_0_0_#0f172a]">
        <DialogHeader><DialogTitle>Delete DNS record? / 删除记录？</DialogTitle><DialogDescription>This action cannot be undone. {record ? `${record.type} ${record.name}` : ""} will be removed.</DialogDescription></DialogHeader>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]">Cancel / 取消</Button><Button type="button" disabled={deleting} onClick={onConfirm} className="rounded-none border-slate-950 bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_#0f172a] hover:bg-red-600">{deleting ? "Deleting…" : "Delete / 删除"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
