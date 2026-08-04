import type { DomainState } from "./types";

export const emptyDomainState: DomainState = {
  domains: [],
  dnsRecords: [],
  activities: [],
};

export function toDomainId(id: number | string): number {
  const value = typeof id === "number" ? id : Number(id);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid domain id: ${id}`);
  }

  return value;
}

export function getDomainFromState(
  state: DomainState,
  id: number | string,
) {
  try {
    const domainId = toDomainId(id);
    return state.domains.find((domain) => domain.id === domainId);
  } catch {
    return undefined;
  }
}

export function getDnsRecordsFromState(
  state: DomainState,
  domainId: number | string,
) {
  try {
    const id = toDomainId(domainId);
    return state.dnsRecords.filter((record) => record.domain_id === id);
  } catch {
    return [];
  }
}
