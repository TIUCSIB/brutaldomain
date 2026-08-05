"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Bell, Wallet } from "lucide-react";

import { NotificationAlertList } from "@/components/notification-alert-list";
import { NotificationHistoryPanel } from "@/components/notification-history-panel";
import { NotificationToolbar } from "@/components/notification-toolbar";
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
import { readAutomationPrefs } from "@/features/settings/automation-prefs";
import { useAutomationPrefs } from "@/features/settings/use-automation-prefs";
import { useSettingsStore } from "@/features/settings/settings-store";

const PREFS_EVENT = "brutaldomain-expiry-prefs";
const AUTOMATION_EVENT = "brutaldomain-automation-prefs";
const QUOTA_WARN_THRESHOLD = 3;

function subscribePrefs(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(PREFS_EVENT, handler);
  window.addEventListener(AUTOMATION_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(PREFS_EVENT, handler);
    window.removeEventListener(AUTOMATION_EVENT, handler);
  };
}

function getPrefsSnapshot(): string {
  const expiry = readExpiryNotifyPrefs();
  const automation = readAutomationPrefs();
  return JSON.stringify({
    dismissed: expiry.dismissed,
    notifyEnabled: automation.notifyEnabled,
    channelInApp: automation.channelInApp,
    notifyDays: automation.notifyDays,
    notifyExpired: automation.notifyExpired,
  });
}

function getServerPrefsSnapshot(): string {
  return JSON.stringify({
    dismissed: {},
    notifyEnabled: true,
    channelInApp: true,
    notifyDays: 30,
    notifyExpired: true,
  });
}

function writeDismissed(dismissed: Record<string, string>) {
  const current = readExpiryNotifyPrefs();
  writeExpiryNotifyPrefs({ ...current, dismissed });
  window.dispatchEvent(new Event(PREFS_EVENT));
}

function riskQueryForWindow(days: number) {
  if (days <= 7) return "within-7";
  if (days <= 30) return "within-30";
  return "within-90";
}

type CenterPrefs = {
  dismissed: ExpiryNotifyPrefs["dismissed"];
  notifyEnabled: boolean;
  channelInApp: boolean;
  notifyDays: number;
  notifyExpired: boolean;
};

export function NotificationCenter() {
  const { domains, initialized, loading } = useDomainStore();
  const { quota, initialized: settingsInitialized } = useSettingsStore();
  const prefsJson = useSyncExternalStore(
    subscribePrefs,
    getPrefsSnapshot,
    getServerPrefsSnapshot,
  );
  const prefs = useMemo(
    () => JSON.parse(prefsJson) as CenterPrefs,
    [prefsJson],
  );
  const { prefs: browserPrefs, history } = useBrowserNotifyState();
  const { prefs: automationPrefs, patchPrefs } = useAutomationPrefs();

  const alerts = useMemo(() => {
    if (!prefs.notifyEnabled || !prefs.channelInApp) return [];
    return getExpiryAlerts(domains, {
      windowDays: prefs.notifyDays,
      dismissed: prefs.dismissed,
      includeExpired: prefs.notifyExpired,
    });
  }, [
    domains,
    prefs.channelInApp,
    prefs.dismissed,
    prefs.notifyDays,
    prefs.notifyEnabled,
    prefs.notifyExpired,
  ]);

  const quotaLow =
    settingsInitialized &&
    quota !== null &&
    quota.available <= QUOTA_WARN_THRESHOLD;

  useBrowserNotifyEffects({
    alerts,
    quotaLow: Boolean(quotaLow),
    quotaAvailable: quota?.available,
    enabled:
      browserPrefs.enabled &&
      automationPrefs.notifyEnabled &&
      automationPrefs.channelBrowser,
  });

  const count = alerts.length + (quotaLow ? 1 : 0);
  const listHref = `/domains?risk=${riskQueryForWindow(prefs.notifyDays)}&sort=expiry-asc`;

  const setWindowDays = useCallback(
    (windowDays: NotifyWindowDays) => {
      const current = readExpiryNotifyPrefs();
      writeExpiryNotifyPrefs({ ...current, windowDays });
      window.dispatchEvent(new Event(PREFS_EVENT));
      patchPrefs({
        notifyDays: windowDays,
        notifyEnabled: true,
        channelInApp: true,
      });
    },
    [patchPrefs],
  );

  const dismissOne = useCallback(
    (domainId: number, expiresAt: string) => {
      writeDismissed({
        ...prefs.dismissed,
        [String(domainId)]: expiresAt,
      });
    },
    [prefs.dismissed],
  );

  const dismissAll = useCallback(() => {
    const dismissed = { ...prefs.dismissed };
    for (const alert of alerts) {
      dismissed[String(alert.domain.id)] = alert.domain.expires_at;
    }
    writeDismissed(dismissed);
  }, [alerts, prefs.dismissed]);

  const clearDismissed = useCallback(() => {
    writeDismissed({});
  }, []);

  async function toggleBrowserNotify() {
    if (browserPrefs.enabled && automationPrefs.channelBrowser) {
      disableBrowserNotify();
      patchPrefs({ channelBrowser: false });
      toast.success("已关闭浏览器通知");
      return;
    }
    const result = await enableBrowserNotify();
    if (result === "granted") {
      patchPrefs({
        channelBrowser: true,
        notifyEnabled: true,
      });
      toast.success("已开启浏览器通知");
    } else if (result === "unsupported") {
      toast.error("当前浏览器不支持通知");
    } else {
      toast.error("未获得通知权限");
    }
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
              {count > 99 ? "99+" : count}
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
            到期 {prefs.notifyDays} 天 · 配额 ≤{QUOTA_WARN_THRESHOLD}
          </span>
        </DropdownMenuLabel>

        <NotificationToolbar
          notifyDays={prefs.notifyDays}
          browserEnabled={
            browserPrefs.enabled && automationPrefs.channelBrowser
          }
          hasDismissed={Object.keys(prefs.dismissed).length > 0}
          onSetWindowDays={setWindowDays}
          onToggleBrowser={() => void toggleBrowserNotify()}
          onClearDismissed={clearDismissed}
        />

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
          windowDays={prefs.notifyDays}
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
