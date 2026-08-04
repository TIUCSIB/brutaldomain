import type {
  ActivityAction,
  ActivityEntry,
  DnsRecord,
  DomainDemoState,
  Subdomain,
} from "./types";

export function createEmptyDomainState(): DomainDemoState {
  return {
    domains: [],
    dnsRecords: [],
    activities: [],
  };
}

export function prependActivity(
  state: DomainDemoState,
  activity: ActivityEntry,
): DomainDemoState {
  return {
    ...state,
    activities: [activity, ...state.activities],
  };
}

export function createClientActivity(
  action: ActivityAction,
  domainId: number | null,
  message: string,
): ActivityEntry {
  const now = new Date();
  const stamp = now.toISOString().replace("T", " ").slice(0, 19);

  return {
    id: `client-${action}-${now.getTime()}`,
    domain_id: domainId,
    action,
    message,
    created_at: stamp,
  };
}

export function mergeDomain(
  state: DomainDemoState,
  nextDomain: Subdomain,
): DomainDemoState {
  const existingIndex = state.domains.findIndex(
    (domain) => domain.id === nextDomain.id,
  );

  if (existingIndex === -1) {
    return { ...state, domains: [...state.domains, nextDomain] };
  }

  const domains = [...state.domains];
  domains[existingIndex] = nextDomain;
  return { ...state, domains };
}

export function replaceDomains(
  state: DomainDemoState,
  domains: Subdomain[],
): DomainDemoState {
  return { ...state, domains };
}

export function replaceDnsRecords(
  state: DomainDemoState,
  domainId: number,
  dnsRecords: DnsRecord[],
): DomainDemoState {
  const remaining = state.dnsRecords.filter(
    (record) => record.domain_id !== domainId,
  );

  return {
    ...state,
    dnsRecords: [...remaining, ...dnsRecords],
  };
}

export function upsertDnsRecord(
  state: DomainDemoState,
  nextRecord: DnsRecord,
): DomainDemoState {
  const remaining = state.dnsRecords.filter(
    (record) => record.id !== nextRecord.id,
  );

  return {
    ...state,
    dnsRecords: [...remaining, nextRecord],
  };
}

export function removeDnsRecord(
  state: DomainDemoState,
  recordId: string,
): DomainDemoState {
  return {
    ...state,
    dnsRecords: state.dnsRecords.filter((record) => record.id !== recordId),
  };
}
