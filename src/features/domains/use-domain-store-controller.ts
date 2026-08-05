"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { fetchDomainById, fetchDomains } from "./domain-api";
import { DNSHE_DOMAIN_FEATURES } from "./domain-repository";
import {
  emptyDomainState,
  getDnsRecordsFromState,
  getDomainFromState,
  toDomainId,
} from "./domain-store-controller-utils";
import {
  getClientHydrationSnapshot,
  getServerHydrationSnapshot,
  subscribeToHydration,
} from "./domain-store-persistence";
import {
  mergeActivities,
  readLocalActivities,
} from "./local-activity";
import { mergeDomain, replaceDnsRecords } from "./domain-store-state";
import { useDomainMutations } from "./use-domain-mutations";
import type {
  DnsRecord,
  DomainState,
  DomainStoreValue,
  Subdomain,
} from "./types";

function toErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

export function useDomainStoreController(): DomainStoreValue {
  const [state, setState] = useState<DomainState>(emptyDomainState);
  const [features, setFeatures] = useState(DNSHE_DOMAIN_FEATURES);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailLoadingIds, setDetailLoadingIds] = useState<number[]>([]);
  const [loadedDetailIds, setLoadedDetailIds] = useState<number[]>([]);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const visibleState = hydrated ? state : emptyDomainState;
  const stateRef = useRef(state);
  const loadedDetailIdsRef = useRef<number[]>([]);
  const bootstrapStartedRef = useRef(false);
  const detailRequestIdsRef = useRef<Set<number>>(new Set());

  const replaceState = useCallback((nextState: DomainState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const markDetailLoaded = useCallback((domainId: number) => {
    loadedDetailIdsRef.current = loadedDetailIdsRef.current.includes(domainId)
      ? loadedDetailIdsRef.current
      : [...loadedDetailIdsRef.current, domainId];
    setLoadedDetailIds(loadedDetailIdsRef.current);
  }, []);

  const setDetailLoading = useCallback((domainId: number, active: boolean) => {
    setDetailLoadingIds((current) =>
      active
        ? current.includes(domainId)
          ? current
          : [...current, domainId]
        : current.filter((item) => item !== domainId),
    );
  }, []);

  const clearDetailCache = useCallback(() => {
    loadedDetailIdsRef.current = [];
    setLoadedDetailIds([]);
    detailRequestIdsRef.current.clear();
  }, []);

  const syncRemoteDomainList = useCallback(async () => {
    const response = await fetchDomains();
    setFeatures(response.features);
    setError(null);
    const domainIds = new Set(response.domains.map((domain) => domain.id));
    loadedDetailIdsRef.current = loadedDetailIdsRef.current.filter((id) =>
      domainIds.has(id),
    );
    setLoadedDetailIds(loadedDetailIdsRef.current);
    replaceState({
      domains: response.domains,
      dnsRecords: stateRef.current.dnsRecords.filter((record) =>
        domainIds.has(record.domain_id),
      ),
      activities: mergeActivities(response.activities, readLocalActivities()),
    });
  }, [replaceState]);

  const refreshDomains = useCallback(async () => {
    setLoading(true);
    try {
      clearDetailCache();
      await syncRemoteDomainList();
    } catch (caught) {
      setError(toErrorMessage(caught, "Failed to load domains"));
      throw caught;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [clearDetailCache, syncRemoteDomainList]);

  useEffect(() => {
    if (!hydrated || bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    void (async () => {
      setLoading(true);
      try {
        await syncRemoteDomainList();
      } catch (caught) {
        setError(toErrorMessage(caught, "Failed to load domains"));
        replaceState(emptyDomainState);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    })();
  }, [hydrated, replaceState, syncRemoteDomainList]);

  const getDomain = useCallback(
    (id: number | string) => getDomainFromState(visibleState, id),
    [visibleState],
  );
  const getDnsRecords = useCallback(
    (domainId: number | string): DnsRecord[] =>
      getDnsRecordsFromState(visibleState, domainId),
    [visibleState],
  );
  const hasDomainDetailCache = useCallback(
    (id: number | string) => loadedDetailIds.includes(Number(id)),
    [loadedDetailIds],
  );
  const isDomainDetailLoading = useCallback(
    (id: number | string) => detailLoadingIds.includes(Number(id)),
    [detailLoadingIds],
  );

  const refreshDomainDetail = useCallback(
    async (
      id: number | string,
      options?: { force?: boolean },
    ): Promise<Subdomain | undefined> => {
      const domainId = toDomainId(id);
      const existing = getDomainFromState(stateRef.current, domainId);
      const hasCache = loadedDetailIdsRef.current.includes(domainId);

      if (!options?.force && hasCache && existing) return existing;
      if (detailRequestIdsRef.current.has(domainId)) return existing;

      detailRequestIdsRef.current.add(domainId);
      setDetailLoading(domainId, true);
      try {
        const response = await fetchDomainById(domainId);
        setFeatures(response.features);
        setError(null);
        const withDomain = mergeDomain(stateRef.current, response.domain);
        const withDns = replaceDnsRecords(
          withDomain,
          response.domain.id,
          response.dnsRecords,
        );
        replaceState({
          ...withDns,
          activities: mergeActivities(
            response.activities,
            readLocalActivities(),
          ),
        });
        markDetailLoaded(response.domain.id);
        return response.domain;
      } catch (caught) {
        if (!existing) setError(toErrorMessage(caught, "Failed to load domain"));
        return existing;
      } finally {
        detailRequestIdsRef.current.delete(domainId);
        setDetailLoading(domainId, false);
        setInitialized(true);
      }
    },
    [markDetailLoaded, replaceState, setDetailLoading],
  );

  const mutations = useDomainMutations({
    markDetailLoaded,
    replaceState,
    stateRef,
    loadedDetailIdsRef,
    setLoadedDetailIds,
    refreshDomainDetail,
  });

  return useMemo(
    () => ({
      features,
      domains: visibleState.domains,
      activities: visibleState.activities,
      hydrated,
      loading,
      initialized,
      error,
      getDomain,
      getDnsRecords,
      hasDomainDetailCache,
      isDomainDetailLoading,
      refreshDomains,
      refreshDomainDetail,
      ...mutations,
    }),
    [
      features,
      visibleState.domains,
      visibleState.activities,
      hydrated,
      loading,
      initialized,
      error,
      getDomain,
      getDnsRecords,
      hasDomainDetailCache,
      isDomainDetailLoading,
      refreshDomains,
      refreshDomainDetail,
      mutations,
    ],
  );
}
