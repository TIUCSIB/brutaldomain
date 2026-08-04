"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { AlertTriangle, Bell, CheckCircle2, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  getExpiryAlerts,
  levelLabel,
  NOTIFY_WINDOW_OPTIONS,
  readExpiryNotifyPrefs,
  writeExpiryNotifyPrefs,
  type ExpiryAlertLevel,
  type ExpiryNotifyPrefs,
  type NotifyWindowDays,
} from "@/features/domains/expiry-alerts";
import {
  formatDomainDate,
  formatExpiry,
} from "@/features/domains/utils";
import { cn } from "@/lib/utils";

const PREFS_EVENT = "brutaldomain-expiry-prefs";

function subscribePrefs(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(PREFS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(PREFS_EVENT, handler);
  };
}

function getPrefsSnapshot(): string {
  return JSON.stringify(readExpiryNotifyPrefs());
}

function getServerPrefsSnapshot(): string {
  return JSON.stringify({ windowDays: 30, dismissed: {} } satisfies ExpiryNotifyPrefs);
}

function setPrefs(next: ExpiryNotifyPrefs) {
  writeExpiryNotifyPrefs(next);
  window.dispatchEvent(new Event(PREFS_EVENT));
}

function levelBadgeClass(level: ExpiryAlertLevel) {
  if (level === "expired") return "bg-[#ff5c7a] text-white";
  if (level === "critical") return "bg-[#ffd84d] text-foreground";
  return "bg-main/15 text-foreground";
}

function riskQueryForWindow(days: NotifyWindowDays) {
  if (days <= 7) return "within-7";
  if (days <= 30) return "within-30";
  return "within-90";
}

export function ExpiryNotifications() {
  const { domains, initialized, loading } = useDomainStore();
  const prefsJson = useSyncExternalStore(
    subscribePrefs,
    getPrefsSnapshot,
    getServerPrefsSnapshot,
  );
  const prefs = useMemo(
    () => JSON.parse(prefsJson) as ExpiryNotifyPrefs,
    [prefsJson],
  );

  const alerts = useMemo(
    () =>
      getExpiryAlerts(domains, {
        windowDays: prefs.windowDays,
        dismissed: prefs.dismissed,
      }),
    [domains, prefs.dismissed, prefs.windowDays],
  );
  const count = alerts.length;
  const badgeText = count > 99 ? "99+" : String(count);

  const setWindowDays = useCallback(
    (windowDays: NotifyWindowDays) => {
      setPrefs({ ...prefs, windowDays });
    },
    [prefs],
  );

  const dismissOne = useCallback(
    (domainId: number, expiresAt: string) => {
      setPrefs({
        ...prefs,
        dismissed: {
          ...prefs.dismissed,
          [String(domainId)]: expiresAt,
        },
      });
    },
    [prefs],
  );

  const dismissAll = useCallback(() => {
    const dismissed = { ...prefs.dismissed };
    for (const alert of alerts) {
      dismissed[String(alert.domain.id)] = alert.domain.expires_at;
    }
    setPrefs({ ...prefs, dismissed });
  }, [alerts, prefs]);

  const clearDismissed = useCallback(() => {
    setPrefs({ ...prefs, dismissed: {} });
  }, [prefs]);

  const listHref = `/domains?risk=${riskQueryForWindow(prefs.windowDays)}&sort=expiry-asc`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={
            count > 0 ? `到期提醒，${count} 条` : "到期提醒，暂无风险"
          }
          className="relative size-9 shrink-0 rounded-none border-2 border-border bg-secondary-background shadow-shadow"
        >
          <Bell className="size-4" strokeWidth={2.5} />
          {count > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 grid min-w-4 place-items-center rounded-full border border-border bg-[#ff5c7a] px-1 text-[10px] font-black leading-none text-white">
              {badgeText}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(92vw,22rem)] rounded-none border-2 border-border bg-secondary-background p-0 text-foreground shadow-shadow"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-2.5 font-black">
          <span>到期提醒</span>
          <span className="text-[11px] font-bold text-foreground/60">
            {prefs.windowDays} 天窗口
          </span>
        </DropdownMenuLabel>

        <div className="flex flex-wrap gap-1 border-y-2 border-border px-3 py-2">
          {NOTIFY_WINDOW_OPTIONS.map((days) => (
            <Button
              key={days}
              type="button"
              size="sm"
              variant={prefs.windowDays === days ? "default" : "outline"}
              className="h-7 rounded-none px-2 text-[11px]"
              onClick={() => setWindowDays(days)}
            >
              {days} 天
            </Button>
          ))}
          {Object.keys(prefs.dismissed).length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto h-7 rounded-none px-2 text-[11px]"
              onClick={clearDismissed}
            >
              恢复已忽略
            </Button>
          ) : null}
        </div>

        {!initialized || loading ? (
          <div className="px-3 py-6 text-center text-xs font-bold text-foreground/60">
            正在同步域名数据…
          </div>
        ) : count === 0 ? (
          <div className="grid place-items-center px-3 py-7 text-center">
            <CheckCircle2 className="size-7 text-emerald-600" />
            <p className="mt-2 text-sm font-black">暂无到期风险</p>
            <p className="mt-1 text-[11px] font-bold text-foreground/65">
              近 {prefs.windowDays} 天内没有需关注的域名
            </p>
          </div>
        ) : (
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
                        <span>
                          {formatDomainDate(alert.domain.expires_at)}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="shrink-0 border-l-2 border-border px-2 text-foreground/55 transition-colors hover:bg-main/10 hover:text-foreground"
                    title="忽略此提醒"
                    aria-label={`忽略 ${alert.domain.full_domain}`}
                    onClick={() =>
                      dismissOne(alert.domain.id, alert.domain.expires_at)
                    }
                  >
                    <EyeOff className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DropdownMenuSeparator className="bg-border" />
        <div className="flex flex-col gap-1.5 p-2">
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center rounded-none text-xs"
              onClick={dismissAll}
            >
              全部标为已读
            </Button>
          ) : null}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 w-full justify-center rounded-none text-xs"
          >
            <Link href={listHref}>
              在域名列表查看
              {count > 0 ? `（${count}）` : ""}
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
