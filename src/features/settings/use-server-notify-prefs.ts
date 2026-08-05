"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_SERVER_NOTIFY_PREFS,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import { redirectIfUnauthorized } from "@/lib/api/request-error";

export interface NotifySecretsStatus {
  telegramConfigured: boolean;
  emailConfigured: boolean;
  cronSecretConfigured: boolean;
  defaultEmail: string | null;
  defaultTelegramChatId: string | null;
  fromEmail: string | null;
  dnsheConfigured?: boolean;
}

export interface NotifyStorageStatus {
  backend: "blob" | "disk" | "memory";
  blobConfigured: boolean;
  storePath: string;
}

export function useServerNotifyPrefs() {
  const [prefs, setPrefs] = useState<ServerNotifyPrefs>(
    DEFAULT_SERVER_NOTIFY_PREFS,
  );
  const [secrets, setSecrets] = useState<NotifySecretsStatus | null>(null);
  const [storage, setStorage] = useState<NotifyStorageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistedWarning, setPersistedWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/notify/prefs", {
        cache: "no-store",
      });
      if (response.status === 401) {
        redirectIfUnauthorized(new Error("unauthorized"));
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as {
        prefs: ServerNotifyPrefs;
        secrets: NotifySecretsStatus;
        storage?: NotifyStorageStatus;
      };
      setPrefs(payload.prefs);
      setSecrets(payload.secrets);
      if (payload.storage) setStorage(payload.storage);
      setLoaded(true);
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(caught instanceof Error ? caught.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: ServerNotifyPrefs) => {
    const response = await fetch("/api/settings/notify/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      prefs?: ServerNotifyPrefs;
      secrets?: NotifySecretsStatus;
      storage?: NotifyStorageStatus;
      warning?: string | null;
      persisted?: boolean;
      persistedToDisk?: boolean;
      persistedToBlob?: boolean;
      backend?: NotifyStorageStatus["backend"];
    };
    if (response.status === 401) {
      redirectIfUnauthorized(new Error("unauthorized"));
      throw new Error("unauthorized");
    }
    if (!response.ok || !payload.prefs) {
      throw new Error(payload.message || `保存失败 HTTP ${response.status}`);
    }
    setPrefs(payload.prefs);
    if (payload.secrets) setSecrets(payload.secrets);
    if (payload.storage) setStorage(payload.storage);
    setPersistedWarning(payload.warning ?? null);
    setLoaded(true);
    return payload;
  }, []);

  return {
    prefs,
    secrets,
    storage,
    loading,
    loaded,
    error,
    persistedWarning,
    refresh,
    save,
  };
}
