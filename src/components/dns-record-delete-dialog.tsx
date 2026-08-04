"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildDnsRecordFqdn } from "@/features/domains/dns-record-name";
import type { DnsRecord } from "@/features/domains/types";

interface RecordDeleteDialogProps {
  deleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  record: DnsRecord | null;
  zoneDomain?: string;
}

export function RecordDeleteDialog({
  deleting,
  onConfirm,
  onOpenChange,
  record,
  zoneDomain,
}: RecordDeleteDialogProps) {
  const label = record
    ? `${record.type} ${
        zoneDomain
          ? buildDnsRecordFqdn(record.name, zoneDomain)
          : record.name
      }`
    : "";

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-slate-950 bg-white text-slate-950 shadow-[7px_7px_0_0_#0f172a]">
        <DialogHeader>
          <DialogTitle>删除这条 DNS 记录？</DialogTitle>
          <DialogDescription>
            此操作不可撤销。
            {label ? ` 将删除 ${label}。` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="rounded-none border-slate-950 bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_#0f172a] hover:bg-red-600"
          >
            {deleting ? "删除中…" : "删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
