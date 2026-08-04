"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getExpiryAlerts,
  levelLabel,
  type ExpiryAlertLevel,
} from "@/features/domains/expiry-alerts";
import {
  formatDomainDate,
  formatExpiry,
} from "@/features/domains/utils";
import { cn } from "@/lib/utils";

function levelBadgeClass(level: ExpiryAlertLevel) {
  if (level === "expired") return "bg-[#ff5c7a] text-white";
  if (level === "critical") return "bg-[#ffd84d] text-foreground";
  return "bg-main/15 text-foreground";
}

export function NotificationAlertList({
  alerts,
  initialized,
  loading,
  quotaLow,
  windowDays,
  onDismiss,
}: {
  alerts: ReturnType<typeof getExpiryAlerts>;
  initialized: boolean;
  loading: boolean;
  quotaLow: boolean;
  windowDays: number;
  onDismiss: (domainId: number, expiresAt: string) => void;
}) {
  if (!initialized || loading) {
    return (
      <div className="px-3 py-6 text-center text-xs font-bold text-foreground/60">
        正在同步域名数据…
      </div>
    );
  }

  if (alerts.length === 0 && !quotaLow) {
    return (
      <div className="grid place-items-center px-3 py-7 text-center">
        <CheckCircle2 className="size-7 text-emerald-600" />
        <p className="mt-2 text-sm font-black">暂无风险通知</p>
        <p className="mt-1 text-[11px] font-bold text-foreground/65">
          近 {windowDays} 天无到期风险，配额也正常
        </p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs font-bold text-foreground/60">
        暂无到期提醒
      </div>
    );
  }

  return (
    <ul className="max-h-80 divide-y-2 divide-border overflow-y-auto">
      {alerts.map((alert) => {
        const expiry = formatExpiry(alert.domain);
        return (
          <li key={alert.domain.id} className="flex items-stretch">
            <Link
              href={`/domains/${alert.domain.id}`}
              className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-main/10"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center border-2 border-border",
                  alert.level === "expired"
                    ? "bg-[#ff5c7a] text-white"
                    : alert.level === "critical"
                      ? "bg-[#ffd84d]"
                      : "bg-main/15",
                )}
              >
                <AlertTriangle className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">
                  {alert.domain.full_domain}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-foreground/70">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border border-border px-1.5 py-0 text-[10px]",
                      levelBadgeClass(alert.level),
                    )}
                  >
                    {levelLabel(alert.level)}
                  </Badge>
                  <span>{expiry.detail}</span>
                  <span>·</span>
                  <span>{formatDomainDate(alert.domain.expires_at)}</span>
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="shrink-0 border-l-2 border-border px-2 text-foreground/55 transition-colors hover:bg-main/10 hover:text-foreground"
              title="忽略此提醒"
              aria-label={`忽略 ${alert.domain.full_domain}`}
              onClick={() =>
                onDismiss(alert.domain.id, alert.domain.expires_at)
              }
            >
              <EyeOff className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
