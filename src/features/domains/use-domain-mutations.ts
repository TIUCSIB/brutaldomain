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
import { appendLocalActivity } from "./local-activity";
import { toDomainId } from "./domain-store-controller-utils";
import {
  mergeDomain,
  prependActivity,
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

function withActivity(
  state: DomainState,
  action: Parameters<typeof appendLocalActivity>[0],
) {
  return prependActivity(state, appendLocalActivity(action));
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
      const withDns = replaceDnsRecords(
        withDomain,
        detail.domain.id,
        detail.dnsRecords,
      );
      replaceState(
        withActivity(withDns, {
          action: "domain.added",
          domainId: detail.domain.id,
          message: `添加域名 ${detail.domain.full_domain}`,
        }),
      );
      markDetailLoaded(detail.domain.id);
      return detail.domain;
    },
    [markDetailLoaded, replaceState, stateRef],
  );

  const deleteDomain = useCallback(
    async (id: number | string) => {
      const domainId = toDomainId(id);
      const existing = stateRef.current.domains.find((item) => item.id === domainId);
      await deleteDomainRequest(id);
      loadedDetailIdsRef.current = loadedDetailIdsRef.current.filter(
        (item) => item !== domainId,
      );
      setLoadedDetailIds(loadedDetailIdsRef.current);
      const nextState: DomainState = {
        domains: stateRef.current.domains.filter((item) => item.id !== domainId),
        dnsRecords: stateRef.current.dnsRecords.filter(
          (record) => record.domain_id !== domainId,
        ),
        activities: stateRef.current.activities.filter(
          (activity) => activity.domain_id !== domainId,
        ),
      };
      replaceState(
        withActivity(nextState, {
          action: "domain.deleted",
          domainId: null,
          message: `删除域名 ${existing?.full_domain ?? `#${domainId}`}`,
        }),
      );
    },
    [loadedDetailIdsRef, replaceState, setLoadedDetailIds, stateRef],
  );

  const renewDomain = useCallback(
    async (id: number | string) => {
      const detail = await renewDomainRequest(id);
      const withDomain = mergeDomain(stateRef.current, detail.domain);
      const withDns = replaceDnsRecords(
        withDomain,
        detail.domain.id,
        detail.dnsRecords,
      );
      replaceState(
        withActivity(withDns, {
          action: "domain.renewed",
          domainId: detail.domain.id,
          message: `续期 ${detail.domain.full_domain} → ${detail.domain.expires_at}`,
        }),
      );
      markDetailLoaded(detail.domain.id);
      return detail.domain;
    },
    [markDetailLoaded, replaceState, stateRef],
  );

  const refreshDomain = useCallback(
    async (id: number | string) => {
      const detail = await refreshDomainDetail(id, { force: true });
      if (!detail) throw new Error("Domain not found");
      replaceState(
        withActivity(stateRef.current, {
          action: "domain.refreshed",
          domainId: detail.id,
          message: `刷新状态 ${detail.full_domain}`,
        }),
      );
      return detail;
    },
    [refreshDomainDetail, replaceState, stateRef],
  );

  const createDnsRecord = useCallback(
    async (domainId: number | string, input: CreateDnsRecordInput) => {
      const { record } = await createDnsRecordRequest(domainId, input);
      const withRecord = upsertDnsRecord(stateRef.current, record);
      replaceState(
        withActivity(withRecord, {
          action: "dns.created",
          domainId: record.domain_id,
          message: `新增 DNS ${record.type} ${record.name} → ${record.content}`,
        }),
      );
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
      const withRecord = upsertDnsRecord(stateRef.current, record);
      replaceState(
        withActivity(withRecord, {
          action: "dns.updated",
          domainId: record.domain_id,
          message: `更新 DNS ${record.type} ${record.name} → ${record.content}`,
        }),
      );
      return record;
    },
    [replaceState, stateRef],
  );

  const deleteDnsRecord = useCallback(
    async (domainId: number | string, recordId: string) => {
      const existing = stateRef.current.dnsRecords.find(
        (record) => record.id === recordId,
      );
      await deleteDnsRecordRequest(domainId, recordId);
      const without = removeDnsRecord(stateRef.current, recordId);
      replaceState(
        withActivity(without, {
          action: "dns.deleted",
          domainId: toDomainId(domainId),
          message: existing
            ? `删除 DNS ${existing.type} ${existing.name}`
            : `删除 DNS 记录 ${recordId}`,
        }),
      );
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
