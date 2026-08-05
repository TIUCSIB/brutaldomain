"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Bell, Wallet } from "lucide-react";

import { NotificationAlertList } from "@/components/notification-alert-list";
import { NotificationHistoryPanel } from "@/components/notification-history-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import {
  getExpiryAlerts,
  NOTIFY_WINDOW_OPTIONS,
  readExpiryNotifyPrefs,
  writeExpiryNotifyPrefs,
  type ExpiryNotifyPrefs,
  type NotifyWindowDays,
} from "@/features/domains/expiry-alerts";
import {
  disableBrowserNotify,
  enableBrowserNotify,
  useBrowserNotifyEffects,
  useBrowserNotifyState,
} from "@/features/domains/use-browser-notify";
import { useSettingsStore } from "@/features/settings/settings-store";

const PREFS_EVENT = "brutaldomain-expiry-prefs";
const QUOTA_WARN_THRESHOLD = 3;

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
  return JSON.stringify({
    windowDays: 30,
    dismissed: {},
  } satisfies ExpiryNotifyPrefs);
}

function setPrefs(next: ExpiryNotifyPrefs) {
  writeExpiryNotifyPrefs(next);
  window.dispatchEvent(new Event(PREFS_EVENT));
}

function riskQueryForWindow(days: NotifyWindowDays) {
  if (days <= 7) return "within-7";
  if (days <= 30) return "within-30";
  return "within-90";
}

/** @deprecated use NotificationCenter */
export const ExpiryNotifications = NotificationCenter;

export function NotificationCenter() {
  const { domains, initialized, loading } = useDomainStore();
  const { quota, initialized: settingsInitialized } = useSettingsStore();
  const prefsJson = useSyncExternalStore(
    subscribePrefs,
    getPrefsSnapshot,
    getServerPrefsSnapshot,
  );
  const prefs = useMemo(
    () => JSON.parse(prefsJson) as ExpiryNotifyPrefs,
    [prefsJson],
  );
  const { prefs: browserPrefs, history } = useBrowserNotifyState();

  const alerts = useMemo(
    () =>
      getExpiryAlerts(domains, {
        windowDays: prefs.windowDays,
        dismissed: prefs.dismissed,
      }),
    [domains, prefs.dismissed, prefs.windowDays],
  );

  const quotaLow =
    settingsInitialized &&
    quota !== null &&
    quota.available <= QUOTA_WARN_THRESHOLD;

  useBrowserNotifyEffects({
    alerts,
    quotaLow: Boolean(quotaLow),
    quotaAvailable: quota?.available,
    enabled: browserPrefs.enabled,
  });

  const count = alerts.length + (quotaLow ? 1 : 0);
  const badgeText = count > 99 ? "99+" : String(count);
  const listHref = `/domains?risk=${riskQueryForWindow(prefs.windowDays)}&sort=expiry-asc`;

  const setWindowDays = useCallback(
    (windowDays: NotifyWindowDays) => setPrefs({ ...prefs, windowDays }),
    [prefs],
  );

  const dismissOne = useCallback(
    (domainId: number, expiresAt: string) => {
      setPrefs({
        ...prefs,
        dismissed: { ...prefs.dismissed, [String(domainId)]: expiresAt },
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

  async function toggleBrowserNotify() {
    if (browserPrefs.enabled) {
      disableBrowserNotify();
      toast.success("已关闭浏览器通知");
      return;
    }
    const result = await enableBrowserNotify();
    if (result === "granted") toast.success("已开启浏览器通知");
    else if (result === "unsupported") toast.error("当前浏览器不支持通知");
    else toast.error("未获得通知权限");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={count > 0 ? `通知，${count} 条` : "通知，暂无风险"}
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
          <span>通知中心</span>
          <span className="text-[11px] font-bold text-foreground/60">
            到期 {prefs.windowDays} 天 · 配额 ≤{QUOTA_WARN_THRESHOLD}
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
          <Button
            type="button"
            size="sm"
            variant={browserPrefs.enabled ? "default" : "outline"}
            className="h-7 rounded-none px-2 text-[11px]"
            onClick={() => void toggleBrowserNotify()}
          >
            浏览器通知
          </Button>
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

        {quotaLow && quota ? (
          <Link
            href="/settings"
            className="flex items-start gap-2.5 border-b-2 border-border bg-[#fff7d6] px-3 py-2.5 transition-colors hover:bg-[#ffe99a]"
          >
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center border-2 border-border bg-[#ffd84d]">
              <Wallet className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">配额不足</span>
              <span className="mt-0.5 block text-[11px] font-bold text-foreground/70">
                可用 {quota.available} / 总计 {quota.total} · 点击查看设置
              </span>
            </span>
          </Link>
        ) : null}

        <NotificationAlertList
          alerts={alerts}
          initialized={initialized}
          loading={loading}
          quotaLow={Boolean(quotaLow)}
          windowDays={prefs.windowDays}
          onDismiss={dismissOne}
        />

        <NotificationHistoryPanel history={history} />

        <DropdownMenuSeparator className="bg-border" />
        <div className="flex flex-col gap-1.5 p-2">
          {alerts.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center rounded-none text-xs"
              onClick={dismissAll}
            >
              到期提醒全部已读
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
              {alerts.length > 0 ? `（${alerts.length}）` : ""}
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
