import { Copy, Download, RefreshCw } from "lucide-react";

import { DomainFormDialog } from "@/components/domain-form-dialog";
import { Button } from "@/components/ui/button";

export function DomainsPageActions({
  selectedCount,
  canExport,
  canExportSelected,
  refreshing,
  loading,
  onCopy,
  onExport,
  onExportSelected,
  onRefresh,
}: {
  selectedCount: number;
  canExport: boolean;
  canExportSelected: boolean;
  refreshing: boolean;
  loading: boolean;
  onCopy: () => void;
  onExport: () => void;
  onExportSelected: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={selectedCount === 0}
      >
        <Copy />
        复制{selectedCount > 0 ? ` ${selectedCount}` : ""}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExportSelected}
        disabled={!canExportSelected}
      >
        <Download />
        导出勾选{selectedCount > 0 ? ` ${selectedCount}` : ""}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={!canExport}
      >
        <Download />
        导出筛选
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing || loading}
      >
        <RefreshCw className={refreshing ? "animate-spin" : ""} />
        同步
      </Button>
      <DomainFormDialog />
    </>
  );
}
