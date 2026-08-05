import type { ActivityAction, ActivityEntry } from "@/features/domains/types";

const STORAGE_KEY = "brutaldomain.activity.v1";
const MAX_ENTRIES = 200;
export const ACTIVITY_EVENT = "brutaldomain-activity";

function canUseStorage() {
  return typeof window !== "undefined";
}

function notify() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

function isActivityEntry(value: unknown): value is ActivityEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as ActivityEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.action === "string" &&
    typeof entry.message === "string" &&
    typeof entry.created_at === "string" &&
    (entry.domain_id === null || typeof entry.domain_id === "number")
  );
}

export function readLocalActivities(): ActivityEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isActivityEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function writeLocalActivities(entries: ActivityEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries.slice(0, MAX_ENTRIES)),
  );
  notify();
}

function formatTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function appendLocalActivity(input: {
  action: ActivityAction;
  message: string;
  domainId?: number | null;
}): ActivityEntry {
  const entry: ActivityEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    domain_id: input.domainId ?? null,
    action: input.action,
    message: input.message,
    created_at: formatTimestamp(),
  };
  const next = [entry, ...readLocalActivities()].slice(0, MAX_ENTRIES);
  writeLocalActivities(next);
  return entry;
}

export function clearLocalActivities() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}

export function mergeActivities(
  remote: readonly ActivityEntry[],
  local: readonly ActivityEntry[],
): ActivityEntry[] {
  const seen = new Set<string>();
  const merged: ActivityEntry[] = [];
  for (const entry of [...local, ...remote]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }
  return merged.sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
}
