import Link from "next/link";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SettingsQuota } from "@/features/settings/types";

function usagePercent(quota: SettingsQuota): number {
  if (quota.total <= 0) return 0;
  return Math.min(100, Math.round((quota.used / quota.total) * 100));
}

function barTone(available: number, total: number): string {
  if (total <= 0) return "bg-foreground/30";
  if (available <= 0) return "bg-[#ff5c7a]";
  if (available <= 3) return "bg-[#ffd84d]";
  return "bg-[#66e58a]";
}

export function DashboardQuotaChip({
  quota,
  initialized,
}: {
  quota: SettingsQuota | null;
  initialized: boolean;
}) {
  const percent = quota ? usagePercent(quota) : 0;
  const tone = quota ? barTone(quota.available, quota.total) : "bg-foreground/20";

  return (
    <Card className="gap-3 bg-secondary-background py-4 text-foreground">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="inline-flex items-center gap-1.5 text-base">
              <Wallet className="size-4" aria-hidden />
              配额概览
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs font-bold text-foreground/70">
              {!initialized
                ? "加载中…"
                : quota
                  ? `已用 ${quota.used} / ${quota.total}`
                  : "暂不可用"}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/settings">设置</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="border-2 border-border bg-main/5 px-2.5 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
              可用
            </p>
            <p className="text-xl font-black leading-none">
              {quota ? quota.available : "—"}
            </p>
          </div>
          <div className="border-2 border-border bg-main/5 px-2.5 py-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">
              使用率
            </p>
            <p className="text-xl font-black leading-none">
              {quota ? `${percent}%` : "—"}
            </p>
          </div>
        </div>
        <div
          className="h-3 border-2 border-border bg-secondary-background"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="配额使用进度"
        >
          <div
            className={`h-full ${tone}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {quota && quota.available <= 3 ? (
          <p className="text-[11px] font-bold text-foreground/80">
            可用配额偏低，请及时在设置中关注。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
