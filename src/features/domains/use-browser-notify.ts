"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { ExpiryAlert } from "@/features/domains/expiry-alerts";
import {
  NOTIFY_HISTORY_EVENT,
  readBrowserNotifyPrefs,
  readNotificationHistory,
  requestBrowserNotifyPermission,
  showBrowserNotification,
  writeBrowserNotifyPrefs,
  type BrowserNotifyPrefs,
  type NotificationHistoryEntry,
} from "@/features/domains/notification-history";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(NOTIFY_HISTORY_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(NOTIFY_HISTORY_EVENT, handler);
  };
}

function getSnapshot() {
  return JSON.stringify({
    prefs: readBrowserNotifyPrefs(),
    history: readNotificationHistory(),
  });
}

function getServerSnapshot() {
  return JSON.stringify({
    prefs: { enabled: false } satisfies BrowserNotifyPrefs,
    history: [] as NotificationHistoryEntry[],
  });
}

export function useBrowserNotifyState() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    return JSON.parse(raw) as {
      prefs: BrowserNotifyPrefs;
      history: NotificationHistoryEntry[];
    };
  }, [raw]);
}

export function useBrowserNotifyEffects(input: {
  alerts: readonly ExpiryAlert[];
  quotaLow: boolean;
  quotaAvailable?: number;
  enabled: boolean;
}) {
  const sentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!input.enabled || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    for (const alert of input.alerts.slice(0, 5)) {
      const key = `expiry:${alert.domain.id}:${alert.domain.expires_at}`;
      if (sentRef.current.has(key)) continue;
      sentRef.current.add(key);
      showBrowserNotification({
        title:
          alert.level === "expired"
            ? "域名已过期"
            : alert.level === "critical"
              ? "域名 7 天内到期"
              : "域名即将到期",
        body: `${alert.domain.full_domain} · ${alert.days < 0 ? `已过期 ${Math.abs(alert.days)} 天` : `剩余 ${alert.days} 天`}`,
        href: `/domains/${alert.domain.id}`,
        tag: key,
      });
    }

    if (input.quotaLow) {
      const key = `quota:${input.quotaAvailable ?? "low"}`;
      if (!sentRef.current.has(key)) {
        sentRef.current.add(key);
        showBrowserNotification({
          title: "配额不足",
          body: `可用配额 ${input.quotaAvailable ?? 0}，请及时处理`,
          href: "/settings",
          tag: key,
        });
      }
    }
  }, [input.alerts, input.enabled, input.quotaAvailable, input.quotaLow]);
}

export async function enableBrowserNotify(): Promise<
  "granted" | "denied" | "unsupported"
> {
  const permission = await requestBrowserNotifyPermission();
  if (permission === "unsupported") return "unsupported";
  if (permission === "granted") {
    writeBrowserNotifyPrefs({ enabled: true });
    return "granted";
  }
  writeBrowserNotifyPrefs({ enabled: false });
  return permission === "denied" ? "denied" : "denied";
}

export function disableBrowserNotify() {
  writeBrowserNotifyPrefs({ enabled: false });
}
