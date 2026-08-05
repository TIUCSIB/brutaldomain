"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  AUTOMATION_PREFS_EVENT,
  DEFAULT_AUTOMATION_PREFS,
  readAutomationPrefs,
  writeAutomationPrefs,
  type AutomationPrefs,
} from "@/features/settings/automation-prefs";
import {
  writeBrowserNotifyPrefs,
} from "@/features/domains/notification-history";
import {
  readExpiryNotifyPrefs,
  writeExpiryNotifyPrefs,
  type NotifyWindowDays,
} from "@/features/domains/expiry-alerts";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(AUTOMATION_PREFS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(AUTOMATION_PREFS_EVENT, handler);
  };
}

function getSnapshot() {
  return JSON.stringify(readAutomationPrefs());
}

function getServerSnapshot() {
  return JSON.stringify(DEFAULT_AUTOMATION_PREFS);
}

/** Map arbitrary notify days onto existing 7/30/90 chips used by NotificationCenter. */
function toLegacyWindowDays(days: number): NotifyWindowDays {
  if (days <= 7) return 7;
  if (days <= 30) return 30;
  return 90;
}

export function useAutomationPrefs() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const prefs = useMemo(
    () => JSON.parse(raw) as AutomationPrefs,
    [raw],
  );

  const setPrefs = useCallback((next: AutomationPrefs) => {
    writeAutomationPrefs(next);

    // Keep topbar notification center window in sync.
    const legacy = readExpiryNotifyPrefs();
    writeExpiryNotifyPrefs({
      ...legacy,
      windowDays: toLegacyWindowDays(next.notifyDays),
    });
    window.dispatchEvent(new Event("brutaldomain-expiry-prefs"));

    // Keep browser notify flag in sync with channel + master switch.
    writeBrowserNotifyPrefs({
      enabled: Boolean(next.channelBrowser && next.notifyEnabled),
    });
  }, []);

  const patchPrefs = useCallback(
    (patch: Partial<AutomationPrefs>) => {
      setPrefs({ ...prefs, ...patch });
    },
    [prefs, setPrefs],
  );

  return { prefs, setPrefs, patchPrefs };
}
