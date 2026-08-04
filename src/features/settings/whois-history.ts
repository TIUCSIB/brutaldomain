import type { WhoisLookupResult } from "@/features/settings/types";

const STORAGE_KEY = "brutaldomain.whois-history.v1";
export const WHOIS_HISTORY_LIMIT = 8;

export interface WhoisHistoryEntry {
  domain: string;
  registered: boolean;
  status: string;
  expires_at?: string;
  nameservers?: string[];
  queriedAt: number;
}

export function readWhoisHistory(): WhoisHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is WhoisHistoryEntry =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as WhoisHistoryEntry).domain === "string" &&
          typeof (item as WhoisHistoryEntry).queriedAt === "number",
      )
      .slice(0, WHOIS_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function pushWhoisHistory(result: WhoisLookupResult): WhoisHistoryEntry[] {
  const entry: WhoisHistoryEntry = {
    domain: result.domain,
    registered: result.registered,
    status: result.status,
    expires_at: result.expires_at,
    nameservers: result.nameservers,
    queriedAt: Date.now(),
  };

  const existing = readWhoisHistory().filter(
    (item) => item.domain.toLowerCase() !== entry.domain.toLowerCase(),
  );
  const next = [entry, ...existing].slice(0, WHOIS_HISTORY_LIMIT);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearWhoisHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
