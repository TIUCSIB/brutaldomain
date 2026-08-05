"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
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
    <ConfirmActionDialog
      open={record !== null}
      onOpenChange={onOpenChange}
      title="删除这条 DNS 记录？"
      description={
        <>
          此操作不可撤销。
          {label ? (
            <>
              {" "}
              将删除 <strong className="text-foreground">{label}</strong>。
            </>
          ) : null}
        </>
      }
      confirmLabel="删除"
      pending={deleting}
      pendingLabel="删除中…"
      onConfirm={onConfirm}
    />
  );
}
