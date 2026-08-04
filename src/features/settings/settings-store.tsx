"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createKey,
  deleteKey,
  fetchKeys,
  fetchQuota,
  regenerateKey,
} from "@/features/settings/api";
import type {
  SettingsApiKey,
  SettingsKeySecretResponse,
  SettingsQuota,
} from "@/features/settings/types";

export interface SettingsStoreValue {
  keys: SettingsApiKey[];
  quota: SettingsQuota | null;
  latestSecret: SettingsKeySecretResponse | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  refreshSettings: (options?: { force?: boolean }) => Promise<void>;
  createApiKey: (input: {
    key_name: string;
    ip_whitelist?: string;
  }) => Promise<SettingsKeySecretResponse>;
  regenerateApiKey: (keyId: number) => Promise<SettingsKeySecretResponse>;
  deleteApiKey: (keyId: number) => Promise<void>;
  clearLatestSecret: () => void;
}

const SettingsStoreContext = createContext<SettingsStoreValue | null>(null);

export function SettingsStoreProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<SettingsApiKey[]>([]);
  const [quota, setQuota] = useState<SettingsQuota | null>(null);
  const [latestSecret, setLatestSecret] =
    useState<SettingsKeySecretResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const bootstrapStartedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const initializedRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    initializedRef.current = initialized;
  }, [initialized]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  const refreshSettings = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && initializedRef.current && !errorRef.current) {
      return;
    }
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const request = (async () => {
      setLoading(true);
      try {
        const [keyResult, quotaResult] = await Promise.all([
          fetchKeys(),
          fetchQuota(),
        ]);
        setKeys(keyResult.keys);
        setQuota(quotaResult.quota);
        setError(null);
        setInitialized(true);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "设置加载失败";
        setError(message);
        setInitialized(true);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    await request;
  }, []);

  useEffect(() => {
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    void refreshSettings({ force: true }).catch(() => {
      // Error is stored in state for UI banners.
    });
  }, [refreshSettings]);

  const createApiKey = useCallback(
    async (input: { key_name: string; ip_whitelist?: string }) => {
      const result = await createKey(input);
      setLatestSecret(result);
      await refreshSettings({ force: true });
      return result;
    },
    [refreshSettings],
  );

  const regenerateApiKey = useCallback(
    async (keyId: number) => {
      const result = await regenerateKey(keyId);
      setLatestSecret(result);
      await refreshSettings({ force: true });
      return result;
    },
    [refreshSettings],
  );

  const deleteApiKey = useCallback(
    async (keyId: number) => {
      await deleteKey(keyId);
      setKeys((current) => current.filter((item) => item.id !== keyId));
      await refreshSettings({ force: true }).catch(() => {
        // Keep optimistic local list if refresh fails.
      });
    },
    [refreshSettings],
  );

  const clearLatestSecret = useCallback(() => {
    setLatestSecret(null);
  }, []);

  const value = useMemo<SettingsStoreValue>(
    () => ({
      keys,
      quota,
      latestSecret,
      loading,
      error,
      initialized,
      refreshSettings,
      createApiKey,
      regenerateApiKey,
      deleteApiKey,
      clearLatestSecret,
    }),
    [
      clearLatestSecret,
      createApiKey,
      deleteApiKey,
      error,
      initialized,
      keys,
      latestSecret,
      loading,
      quota,
      refreshSettings,
      regenerateApiKey,
    ],
  );

  return (
    <SettingsStoreContext.Provider value={value}>
      {children}
    </SettingsStoreContext.Provider>
  );
}

export function useSettingsStore(): SettingsStoreValue {
  const context = useContext(SettingsStoreContext);
  if (!context) {
    throw new Error(
      "useSettingsStore must be used inside SettingsStoreProvider",
    );
  }
  return context;
}
