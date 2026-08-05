"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import {
  DnsRecordsFilters,
  DnsRecordsHeader,
} from "@/components/dns-records-toolbar";
import type {
  CreateDnsRecordInput,
  DnsRecord,
  UpdateDnsRecordInput,
} from "@/features/domains/types";
import { useDnsRecordsController } from "@/features/domains/use-dns-records-controller";

import { RecordDeleteDialog } from "./dns-record-delete-dialog";
import { RecordEditorDialog } from "./dns-records-dialogs";
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
  const ctrl = useDnsRecordsController({
    domainId,
    zoneDomain,
    records,
    createRecord,
    updateRecord,
    deleteRecord,
  });

  return (
    <section
      aria-labelledby="dns-records-title"
      className="border-2 border-border bg-secondary-background shadow-shadow"
    >
      <DnsRecordsHeader
        titleId="dns-records-title"
        zoneDomain={zoneDomain}
        recordCount={records.length}
        filteredCount={ctrl.visibleRecords.length}
        queryActive={Boolean(ctrl.query.trim())}
        sessionLabel={ctrl.sessionLabel}
        canWrite={canWrite}
        exportDisabled={records.length === 0}
        onExport={ctrl.handleExport}
        onAdd={() => ctrl.openCreate()}
      />
      {!canWrite ? (
        <div className="border-b-2 border-border bg-[#fff7d6] px-3 py-2 text-xs font-bold text-foreground/80">
          当前数据可查看，但 DNS 写入已关闭。
        </div>
      ) : null}

      <DnsRecordsFilters
        canWrite={canWrite}
        query={ctrl.query}
        onQueryChange={ctrl.setQuery}
        templates={ctrl.templates}
        batchTemplates={ctrl.batchTemplates}
        batchBusy={ctrl.batchBusy}
        onOpenTemplate={(id) => ctrl.openCreate(id)}
        onOpenBatch={ctrl.setBatchId}
      />

      <DnsRecordsView
        canWrite={canWrite}
        domainId={domainId}
        onDelete={ctrl.setDeleteTarget}
        onEdit={ctrl.openEdit}
        records={ctrl.visibleRecords}
      />
      <RecordEditorDialog
        editingRecord={ctrl.editingRecord}
        form={ctrl.form}
        formError={ctrl.formError}
        onChange={ctrl.setForm}
        onOpenChange={ctrl.setDialogOpen}
        onSubmit={ctrl.handleSubmit}
        open={ctrl.dialogOpen}
        proxyEditing={proxyEditing}
        submitting={ctrl.submitting}
        zoneDomain={zoneDomain}
      />
      <RecordDeleteDialog
        deleting={ctrl.deleting}
        onConfirm={ctrl.confirmDelete}
        onOpenChange={(open) => !open && ctrl.setDeleteTarget(null)}
        record={ctrl.deleteTarget}
        zoneDomain={zoneDomain}
      />
      <ConfirmActionDialog
        open={ctrl.batchId !== null}
        onOpenChange={(open) => {
          if (!open && !ctrl.batchBusy) ctrl.setBatchId(null);
        }}
        title={
          ctrl.pendingBatch
            ? `应用「${ctrl.pendingBatch.label}」？`
            : "应用批量模板？"
        }
        description={
          ctrl.pendingBatch ? (
            <>
              将向 <strong className="text-foreground">{zoneDomain}</strong>{" "}
              连续创建 {ctrl.pendingBatch.build(zoneDomain).length}{" "}
              条记录。已存在的同名记录可能导致部分失败。
              <span className="mt-1 block text-foreground/60">
                {ctrl.pendingBatch.description}
              </span>
            </>
          ) : (
            "确认后将批量创建 DNS 记录。"
          )
        }
        confirmLabel="开始创建"
        pending={ctrl.batchBusy}
        pendingLabel="创建中…"
        tone="default"
        onConfirm={() => void ctrl.confirmBatchApply()}
      />
    </section>
  );
}
