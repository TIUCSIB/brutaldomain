import { SearchX } from "lucide-react";

import { DomainFormDialog } from "@/components/domain-form-dialog";
import { Button } from "@/components/ui/button";

export function DomainListEmpty({
  error,
  filtersActive,
  canCreate,
  onReset,
}: {
  error: string | null;
  filtersActive: boolean;
  canCreate: boolean;
  onReset: () => void;
}) {
  return (
    <div className="grid min-h-48 place-items-center border-2 border-dashed border-border bg-secondary-background p-6 text-center shadow-shadow">
      <div>
        <span className="mx-auto grid size-12 place-items-center border-2 border-border bg-main/10 shadow-shadow">
          <SearchX
            aria-hidden="true"
            className="size-6 text-main"
            strokeWidth={2.5}
          />
        </span>
        <h3 className="mt-3 text-base font-black">
          {error ? "无法加载域名" : "没有匹配的域名"}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs font-bold text-foreground/70">
          {error
            ? "请先解决上方的 DNSHE 配置或请求错误。"
            : "请调整搜索词或筛选条件。"}
        </p>
        {!error && filtersActive ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="mt-3"
          >
            清除全部
          </Button>
        ) : null}
        {!error && !filtersActive && canCreate ? (
          <div className="mt-3">
            <DomainFormDialog />
          </div>
        ) : null}
      </div>
    </div>
  );
}
