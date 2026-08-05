import type { ActivityEntry, DnsRecord, DomainState, Subdomain } from "./types";

/** Prefer incoming values, but keep known fields when detail payload omits them. */
export function mergeSubdomainRecord(
  existing: Subdomain | undefined,
  incoming: Subdomain,
): Subdomain {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,
    provider_account_id:
      incoming.provider_account_id ?? existing.provider_account_id,
    cloudflare_zone_id:
      incoming.cloudflare_zone_id ?? existing.cloudflare_zone_id,
    created_at: incoming.created_at || existing.created_at,
    updated_at: incoming.updated_at || existing.updated_at,
    expires_at: incoming.expires_at || existing.expires_at,
  };
}

export function mergeDomain(state: DomainState, domain: Subdomain): DomainState {
  const existing = state.domains.find((item) => item.id === domain.id);
  const merged = mergeSubdomainRecord(existing, domain);

  return {
    ...state,
    domains: existing
      ? state.domains.map((item) => (item.id === domain.id ? merged : item))
      : [...state.domains, merged],
  };
}

export function replaceDnsRecords(
  state: DomainState,
  domainId: number,
  records: DnsRecord[],
): DomainState {
  return {
    ...state,
    dnsRecords: [
      ...state.dnsRecords.filter((record) => record.domain_id !== domainId),
      ...records,
    ],
  };
}

export function upsertDnsRecord(state: DomainState, record: DnsRecord): DomainState {
  const exists = state.dnsRecords.some((item) => item.id === record.id);

  return {
    ...state,
    dnsRecords: exists
      ? state.dnsRecords.map((item) => (item.id === record.id ? record : item))
      : [...state.dnsRecords, record],
  };
}

export function removeDnsRecord(state: DomainState, recordId: string): DomainState {
  return {
    ...state,
    dnsRecords: state.dnsRecords.filter((record) => record.id !== recordId),
  };
}

export function prependActivity(
  state: DomainState,
  entry: ActivityEntry,
): DomainState {
  return {
    ...state,
    activities: [entry, ...state.activities].slice(0, 300),
  };
}
