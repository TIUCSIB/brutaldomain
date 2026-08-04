"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  createDnsRecordRequest,
  createDomainRequest,
  deleteDnsRecordRequest,
  deleteDomainRequest,
  fetchDomainById,
  fetchDomains,
  renewDomainRequest,
  updateDnsRecordRequest,
} from "./domain-api";
import { serverSnapshotState, toDomainId } from "./domain-store-controller-utils";
import {
  DOMAIN_STORE_STORAGE_KEY,
  deserializeDomainStore,
  getClientHydrationSnapshot,
  getServerHydrationSnapshot,
  loadInitialDomainState,
  serializeDomainStore,
  subscribeToHydration,
} from "./domain-store-persistence";
import { MOCK_DOMAIN_FEATURES } from "./domain-repository";
import {
  addDomain as addDomainInRepository,
  createDnsRecord as createDnsRecordInRepository,
  deleteDnsRecord as deleteDnsRecordInRepository,
  deleteDomain as deleteDomainInRepository,
  formatDateTime,
  getDnsRecords as getDnsRecordsFromRepository,
  getDomain as getDomainFromRepository,
  refreshDomain as refreshDomainInRepository,
  renewDomain as renewDomainInRepository,
  resetDemoData as resetRepositoryDemoData,
  updateDnsRecord as updateDnsRecordInRepository,
  type RepositoryResult,
} from "./mock-domain-repository";
import {
  mergeDomain,
  removeDnsRecord,
  replaceDnsRecords,
  upsertDnsRecord,
} from "./domain-store-state";
import type {
  AddDomainInput,
  CreateDnsRecordInput,
  DnsRecord,
  DomainDemoState,
  DomainSource,
  DomainStoreValue,
  Subdomain,
  UpdateDnsRecordInput,
} from "./types";

export function useDomainStoreController(): DomainStoreValue {
  const [bootstrap] = useState(loadInitialDomainState);
  const [state, setState] = useState<DomainDemoState>(bootstrap.state);
  const [source, setSource] = useState<DomainSource>("mock");
  const [features, setFeatures] = useState(MOCK_DOMAIN_FEATURES);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [detailLoadingIds, setDetailLoadingIds] = useState<number[]>([]);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const visibleState = hydrated ? state : serverSnapshotState;
  const stateRef = useRef(state);
  const sourceRef = useRef(source);
  const initializedRef = useRef(initialized);

  const replaceState = useCallback((nextState: DomainDemoState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    sourceRef.current = source;
    initializedRef.current = initialized;
  }, [initialized, source]);

  useEffect(() => {
    if (!hydrated || source !== "mock") return;
    try {
      window.localStorage.setItem(DOMAIN_STORE_STORAGE_KEY, serializeDomainStore(state));
    } catch {}
  }, [hydrated, source, state]);

  useEffect(() => {
    if (!hydrated) return;
    function handleStorage(event: StorageEvent) {
      if (sourceRef.current !== "mock") return;
      if (event.key !== DOMAIN_STORE_STORAGE_KEY || event.newValue === null) return;
      const restored = deserializeDomainStore(event.newValue);
      if (restored) replaceState(restored);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrated, replaceState]);

  const applyMockOperation = useCallback(
    <T,>(operation: (current: DomainDemoState) => RepositoryResult<T>): T => {
      const result = operation(stateRef.current);
      replaceState(result.state);
      return result.value;
    },
    [replaceState],
  );

  const setDetailLoading = useCallback((domainId: number, active: boolean) => {
    setDetailLoadingIds((current) =>
      active
        ? current.includes(domainId)
          ? current
          : [...current, domainId]
        : current.filter((item) => item !== domainId),
    );
  }, []);

  const syncRemoteDomainList = useCallback(async (preserveLocalMockState: boolean) => {
    const response = await fetchDomains();
    setSource(response.source);
    setFeatures(response.features);
    setInitialized(true);
    if (response.source === "mock" && preserveLocalMockState && bootstrap.hasPersistedState) return;
    const domainIds = new Set(response.domains.map((domain) => domain.id));
    replaceState({
      domains: response.domains,
      dnsRecords: stateRef.current.dnsRecords.filter((record) => domainIds.has(record.domain_id)),
      activities: response.activities,
    });
  }, [bootstrap.hasPersistedState, replaceState]);

  const refreshDomains = useCallback(async () => {
    setLoading(true);
    try {
      await syncRemoteDomainList(false);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [syncRemoteDomainList]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      setLoading(true);
      try {
        await syncRemoteDomainList(true);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    })();
  }, [hydrated, syncRemoteDomainList]);

  const getDomain = useCallback((id: number | string) => getDomainFromRepository(visibleState, id), [visibleState]);
  const getDnsRecords = useCallback((domainId: number | string): DnsRecord[] => getDnsRecordsFromRepository(visibleState, domainId), [visibleState]);
  const isDomainDetailLoading = useCallback((id: number | string) => detailLoadingIds.includes(Number(id)), [detailLoadingIds]);

  const refreshDomainDetail = useCallback(async (id: number | string): Promise<Subdomain | undefined> => {
    const domainId = toDomainId(id);
    const existing = getDomainFromRepository(stateRef.current, domainId);
    if (initializedRef.current && sourceRef.current === "mock" && existing) return existing;
    setDetailLoading(domainId, true);
    try {
      const response = await fetchDomainById(domainId);
      setSource(response.source);
      setFeatures(response.features);
      setInitialized(true);
      const withDomain = mergeDomain(stateRef.current, response.domain);
      const withDns = replaceDnsRecords(withDomain, response.domain.id, response.dnsRecords);
      replaceState({
        ...withDns,
        activities: response.source === "mock" ? response.activities : withDns.activities.filter((activity) => activity.domain_id !== response.domain.id),
      });
      return response.domain;
    } catch {
      return existing;
    } finally {
      setDetailLoading(domainId, false);
    }
  }, [replaceState, setDetailLoading]);

  const now = useCallback(() => formatDateTime(new Date()), []);

  const addDomain = useCallback(async (input: AddDomainInput) => {
    if (sourceRef.current === "mock") {
      return applyMockOperation((current) => addDomainInRepository(current, input, now()));
    }
    const detail = await createDomainRequest(input);
    const withDomain = mergeDomain(stateRef.current, detail.domain);
    const withDns = replaceDnsRecords(withDomain, detail.domain.id, detail.dnsRecords);
    replaceState({ ...withDns, activities: withDns.activities });
    return detail.domain;
  }, [applyMockOperation, now, replaceState]);

  const deleteDomain = useCallback(async (id: number | string) => {
    if (sourceRef.current === "mock") {
      applyMockOperation((current) => deleteDomainInRepository(current, id, now()));
      return;
    }
    await deleteDomainRequest(id);
    const domainId = toDomainId(id);
    replaceState({
      domains: stateRef.current.domains.filter((item) => item.id !== domainId),
      dnsRecords: stateRef.current.dnsRecords.filter((record) => record.domain_id !== domainId),
      activities: stateRef.current.activities.filter((activity) => activity.domain_id !== domainId),
    });
  }, [applyMockOperation, now, replaceState]);

  const renewDomain = useCallback(async (id: number | string, years = 1) => {
    if (sourceRef.current === "mock") {
      return applyMockOperation((current) => renewDomainInRepository(current, id, years, now()));
    }
    const detail = await renewDomainRequest(id);
    const withDomain = mergeDomain(stateRef.current, detail.domain);
    const withDns = replaceDnsRecords(withDomain, detail.domain.id, detail.dnsRecords);
    replaceState({ ...withDns, activities: withDns.activities });
    return detail.domain;
  }, [applyMockOperation, now, replaceState]);

  const refreshDomain = useCallback(async (id: number | string) => {
    if (sourceRef.current === "mock") {
      return applyMockOperation((current) => refreshDomainInRepository(current, id, now()));
    }
    const detail = await refreshDomainDetail(id);
    if (!detail) throw new Error("Domain not found");
    return detail;
  }, [applyMockOperation, now, refreshDomainDetail]);

  const createDnsRecord = useCallback(async (domainId: number | string, input: CreateDnsRecordInput) => {
    if (sourceRef.current === "mock") return applyMockOperation((current) => createDnsRecordInRepository(current, domainId, input, now()));
    const { record } = await createDnsRecordRequest(domainId, input);
    replaceState(upsertDnsRecord(stateRef.current, record));
    return record;
  }, [applyMockOperation, now, replaceState]);

  const updateDnsRecord = useCallback(async (domainId: number | string, recordId: string, input: UpdateDnsRecordInput) => {
    if (sourceRef.current === "mock") return applyMockOperation((current) => updateDnsRecordInRepository(current, domainId, recordId, input, now()));
    const { record } = await updateDnsRecordRequest(domainId, recordId, input);
    replaceState(upsertDnsRecord(stateRef.current, record));
    return record;
  }, [applyMockOperation, now, replaceState]);

  const deleteDnsRecord = useCallback(async (domainId: number | string, recordId: string) => {
    if (sourceRef.current === "mock") {
      applyMockOperation((current) => deleteDnsRecordInRepository(current, domainId, recordId, now()));
      return;
    }
    await deleteDnsRecordRequest(domainId, recordId);
    replaceState(removeDnsRecord(stateRef.current, recordId));
  }, [applyMockOperation, now, replaceState]);

  const resetDemoData = useCallback(() => {
    if (sourceRef.current !== "mock") return;
    replaceState(resetRepositoryDemoData());
  }, [replaceState]);

  return useMemo(() => ({
    source,
    features,
    domains: visibleState.domains,
    activities: visibleState.activities,
    hydrated,
    loading,
    initialized,
    getDomain,
    getDnsRecords,
    isDomainDetailLoading,
    refreshDomains,
    refreshDomainDetail,
    addDomain,
    deleteDomain,
    renewDomain,
    refreshDomain,
    createDnsRecord,
    updateDnsRecord,
    deleteDnsRecord,
    resetDemoData,
  }), [source, features, visibleState.domains, visibleState.activities, hydrated, loading, initialized, getDomain, getDnsRecords, isDomainDetailLoading, refreshDomains, refreshDomainDetail, addDomain, deleteDomain, renewDomain, refreshDomain, createDnsRecord, updateDnsRecord, deleteDnsRecord, resetDemoData]);
}
