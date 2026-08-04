"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import {
  createDnsRecordRequest,
  createDomainRequest,
  deleteDnsRecordRequest,
  deleteDomainRequest,
  renewDomainRequest,
  updateDnsRecordRequest,
} from "./domain-api";
import { toDomainId } from "./domain-store-controller-utils";
import {
  mergeDomain,
  removeDnsRecord,
  replaceDnsRecords,
  upsertDnsRecord,
} from "./domain-store-state";
import type {
  AddDomainInput,
  CreateDnsRecordInput,
  DomainState,
  Subdomain,
  UpdateDnsRecordInput,
} from "./types";

interface MutationArgs {
  markDetailLoaded: (domainId: number) => void;
  replaceState: (nextState: DomainState) => void;
  stateRef: MutableRefObject<DomainState>;
  loadedDetailIdsRef: MutableRefObject<number[]>;
  setLoadedDetailIds: Dispatch<SetStateAction<number[]>>;
  refreshDomainDetail: (
    id: number | string,
    options?: { force?: boolean },
  ) => Promise<Subdomain | undefined>;
}

export function useDomainMutations({
  markDetailLoaded,
  replaceState,
  stateRef,
  loadedDetailIdsRef,
  setLoadedDetailIds,
  refreshDomainDetail,
}: MutationArgs) {
  const addDomain = useCallback(
    async (input: AddDomainInput) => {
      const detail = await createDomainRequest(input);
      const withDomain = mergeDomain(stateRef.current, detail.domain);
      replaceState(replaceDnsRecords(withDomain, detail.domain.id, detail.dnsRecords));
      markDetailLoaded(detail.domain.id);
      return detail.domain;
    },
    [markDetailLoaded, replaceState, stateRef],
  );

  const deleteDomain = useCallback(
    async (id: number | string) => {
      await deleteDomainRequest(id);
      const domainId = toDomainId(id);
      loadedDetailIdsRef.current = loadedDetailIdsRef.current.filter(
        (item) => item !== domainId,
      );
      setLoadedDetailIds(loadedDetailIdsRef.current);
      replaceState({
        domains: stateRef.current.domains.filter((item) => item.id !== domainId),
        dnsRecords: stateRef.current.dnsRecords.filter(
          (record) => record.domain_id !== domainId,
        ),
        activities: stateRef.current.activities.filter(
          (activity) => activity.domain_id !== domainId,
        ),
      });
    },
    [loadedDetailIdsRef, replaceState, setLoadedDetailIds, stateRef],
  );

  const renewDomain = useCallback(
    async (id: number | string) => {
      const detail = await renewDomainRequest(id);
      const withDomain = mergeDomain(stateRef.current, detail.domain);
      replaceState(replaceDnsRecords(withDomain, detail.domain.id, detail.dnsRecords));
      markDetailLoaded(detail.domain.id);
      return detail.domain;
    },
    [markDetailLoaded, replaceState, stateRef],
  );

  const refreshDomain = useCallback(
    async (id: number | string) => {
      const detail = await refreshDomainDetail(id, { force: true });
      if (!detail) throw new Error("Domain not found");
      return detail;
    },
    [refreshDomainDetail],
  );

  const createDnsRecord = useCallback(
    async (domainId: number | string, input: CreateDnsRecordInput) => {
      const { record } = await createDnsRecordRequest(domainId, input);
      replaceState(upsertDnsRecord(stateRef.current, record));
      return record;
    },
    [replaceState, stateRef],
  );

  const updateDnsRecord = useCallback(
    async (
      domainId: number | string,
      recordId: string,
      input: UpdateDnsRecordInput,
    ) => {
      const { record } = await updateDnsRecordRequest(domainId, recordId, input);
      replaceState(upsertDnsRecord(stateRef.current, record));
      return record;
    },
    [replaceState, stateRef],
  );

  const deleteDnsRecord = useCallback(
    async (domainId: number | string, recordId: string) => {
      await deleteDnsRecordRequest(domainId, recordId);
      replaceState(removeDnsRecord(stateRef.current, recordId));
    },
    [replaceState, stateRef],
  );

  return {
    addDomain,
    deleteDomain,
    renewDomain,
    refreshDomain,
    createDnsRecord,
    updateDnsRecord,
    deleteDnsRecord,
  };
}
