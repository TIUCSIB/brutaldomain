const STORAGE_KEY = "brutaldomain.notification-history.v1";
const PREFS_KEY = "brutaldomain.browser-notify.v1";
export const NOTIFY_HISTORY_EVENT = "brutaldomain-notify-history";
const MAX_ENTRIES = 50;

export interface NotificationHistoryEntry {
  id: string;
  title: string;
  body: string;
  href?: string;
  createdAt: number;
  source: "expiry" | "quota" | "manual" | "browser";
}

export interface BrowserNotifyPrefs {
  enabled: boolean;
}

const DEFAULT_PREFS: BrowserNotifyPrefs = { enabled: false };

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFY_HISTORY_EVENT));
}

export function readBrowserNotifyPrefs(): BrowserNotifyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<BrowserNotifyPrefs>;
    return { enabled: Boolean(parsed.enabled) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeBrowserNotifyPrefs(prefs: BrowserNotifyPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  notify();
}

export function readNotificationHistory(): NotificationHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is NotificationHistoryEntry =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as NotificationHistoryEntry).id === "string" &&
          typeof (item as NotificationHistoryEntry).title === "string",
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function pushNotificationHistory(
  entry: Omit<NotificationHistoryEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: number;
  },
): NotificationHistoryEntry[] {
  const nextEntry: NotificationHistoryEntry = {
    id: entry.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: entry.title,
    body: entry.body,
    href: entry.href,
    source: entry.source,
    createdAt: entry.createdAt ?? Date.now(),
  };
  const next = [nextEntry, ...readNotificationHistory()].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  }
  return next;
}

export function clearNotificationHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}

export async function requestBrowserNotifyPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showBrowserNotification(input: {
  title: string;
  body: string;
  href?: string;
  tag?: string;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const notification = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
    });
    if (input.href) {
      notification.onclick = () => {
        window.focus();
        window.location.href = input.href!;
        notification.close();
      };
    }
    pushNotificationHistory({
      title: input.title,
      body: input.body,
      href: input.href,
      source: "browser",
    });
    return true;
  } catch {
    return false;
  }
}
