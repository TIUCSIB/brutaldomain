"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_SERVER_RENEW_PREFS,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import type { RenewHistoryEntry } from "@/lib/renew/renew-state-store";
import { redirectIfUnauthorized } from "@/lib/api/request-error";

export interface RenewStorageStatus {
  backend: "blob" | "disk" | "memory";
  blobConfigured: boolean;
}

export interface RenewRuntimeStatus {
  dnsheConfigured: boolean;
  cronSecretConfigured: boolean;
  emailConfigured: boolean;
  telegramConfigured: boolean;
  fromEmail: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  history: RenewHistoryEntry[];
}

export function useServerRenewPrefs() {
  const [prefs, setPrefs] = useState<ServerRenewPrefs>(
    DEFAULT_SERVER_RENEW_PREFS,
  );
  const [status, setStatus] = useState<RenewRuntimeStatus | null>(null);
  const [storage, setStorage] = useState<RenewStorageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistedWarning, setPersistedWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/renew/prefs", {
        cache: "no-store",
      });
      if (response.status === 401) {
        redirectIfUnauthorized(new Error("unauthorized"));
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        prefs: ServerRenewPrefs;
        status: RenewRuntimeStatus;
        storage?: RenewStorageStatus;
      };
      setPrefs(payload.prefs);
      setStatus(payload.status);
      if (payload.storage) setStorage(payload.storage);
      setLoaded(true);
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(caught instanceof Error ? caught.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: ServerRenewPrefs) => {
    const response = await fetch("/api/settings/renew/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      prefs?: ServerRenewPrefs;
      status?: RenewRuntimeStatus;
      storage?: RenewStorageStatus;
      warning?: string | null;
      persisted?: boolean;
      persistedToDisk?: boolean;
      persistedToBlob?: boolean;
      backend?: RenewStorageStatus["backend"];
    };
    if (response.status === 401) {
      redirectIfUnauthorized(new Error("unauthorized"));
      throw new Error("unauthorized");
    }
    if (!response.ok || !payload.prefs || !payload.status) {
      throw new Error(payload.message || `保存失败 HTTP ${response.status}`);
    }
    setPrefs(payload.prefs);
    setStatus(payload.status);
    if (payload.storage) setStorage(payload.storage);
    setPersistedWarning(payload.warning ?? null);
    setLoaded(true);
    return payload;
  }, []);

  return {
    prefs,
    status,
    storage,
    loading,
    loaded,
    error,
    persistedWarning,
    refresh,
    save,
  };
}
