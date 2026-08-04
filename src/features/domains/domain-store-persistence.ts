import { resetDemoData as resetRepositoryDemoData } from "./mock-domain-repository";
import {
  ACTIVITY_ACTIONS,
  DNS_RECORD_TYPES,
  DOMAIN_STATUSES,
  type DomainDemoState,
} from "./types";

export const DOMAIN_STORE_STORAGE_KEY = "domain-console.demo-state.v1";

interface PersistedDomainStore {
  version: 1;
  state: DomainDemoState;
}

export interface DomainStoreBootstrap {
  hasPersistedState: boolean;
  state: DomainDemoState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSubdomain(value: unknown): value is DomainDemoState["domains"][number] {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.subdomain === "string" &&
    typeof value.rootdomain === "string" &&
    typeof value.full_domain === "string" &&
    DOMAIN_STATUSES.some((status) => status === value.status) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    typeof value.expires_at === "string" &&
    (value.never_expires === 0 || value.never_expires === 1) &&
    (value.cloudflare_zone_id === null ||
      typeof value.cloudflare_zone_id === "string") &&
    (value.provider_account_id === null ||
      Number.isSafeInteger(value.provider_account_id))
  );
}

function isDnsRecord(value: unknown): value is DomainDemoState["dnsRecords"][number] {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    Number.isSafeInteger(value.domain_id) &&
    DNS_RECORD_TYPES.some((type) => type === value.type) &&
    typeof value.name === "string" &&
    typeof value.content === "string" &&
    isFiniteNumber(value.ttl) &&
    typeof value.proxied === "boolean" &&
    (value.priority === undefined || isFiniteNumber(value.priority)) &&
    (value.provider_record_id === undefined ||
      typeof value.provider_record_id === "string") &&
    (value.line === undefined || typeof value.line === "string") &&
    (value.status === undefined || typeof value.status === "string") &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

function isActivityEntry(
  value: unknown,
): value is DomainDemoState["activities"][number] {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    (value.domain_id === null || Number.isSafeInteger(value.domain_id)) &&
    ACTIVITY_ACTIONS.some((action) => action === value.action) &&
    typeof value.message === "string" &&
    typeof value.created_at === "string"
  );
}

function isDomainDemoState(value: unknown): value is DomainDemoState {
  if (!isRecord(value)) return false;

  return (
    Array.isArray(value.domains) &&
    value.domains.every(isSubdomain) &&
    Array.isArray(value.dnsRecords) &&
    value.dnsRecords.every(isDnsRecord) &&
    Array.isArray(value.activities) &&
    value.activities.every(isActivityEntry)
  );
}

export function serializeDomainStore(state: DomainDemoState): string {
  const persisted: PersistedDomainStore = { version: 1, state };
  return JSON.stringify(persisted);
}

export function deserializeDomainStore(value: string): DomainDemoState | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !isDomainDemoState(parsed.state)
    ) {
      return null;
    }

    return parsed.state;
  } catch {
    return null;
  }
}

export function subscribeToHydration(): () => void {
  return () => undefined;
}

export function getClientHydrationSnapshot(): boolean {
  return true;
}

export function getServerHydrationSnapshot(): boolean {
  return false;
}

export function loadInitialDomainState(): DomainStoreBootstrap {
  const fallback = resetRepositoryDemoData();

  if (typeof window === "undefined") {
    return { hasPersistedState: false, state: fallback };
  }

  try {
    const persisted = window.localStorage.getItem(DOMAIN_STORE_STORAGE_KEY);
    const state = persisted ? deserializeDomainStore(persisted) : null;

    return {
      hasPersistedState: state !== null,
      state: state ?? fallback,
    };
  } catch {
    return { hasPersistedState: false, state: fallback };
  }
}
