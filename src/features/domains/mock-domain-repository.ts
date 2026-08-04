import { domainDemoStateFixture } from "@/data/domains";

import type {
  ActivityAction,
  ActivityEntry,
  AddDomainInput,
  CreateDnsRecordInput,
  DnsRecord,
  DomainDemoState,
  DomainStatus,
  Subdomain,
  UpdateDnsRecordInput,
} from "./types";

export const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export type RepositoryErrorCode =
  | "DOMAIN_NOT_FOUND"
  | "DOMAIN_ALREADY_EXISTS"
  | "DNS_RECORD_NOT_FOUND"
  | "INVALID_INPUT";

export class DomainRepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = "DomainRepositoryError";
    this.code = code;
  }
}

export interface RepositoryResult<T> {
  state: DomainDemoState;
  value: T;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new DomainRepositoryError("INVALID_INPUT", "Invalid date");
  }

  const year = date.getFullYear();
  if (year < 0 || year > 9999) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      "Date year must be between 0000 and 9999",
    );
  }

  return [
    String(year).padStart(4, "0"),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function parseDateTime(value: string): Date {
  if (!DATE_TIME_PATTERN.test(value)) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      `Invalid date-time format: ${value}`,
    );
  }

  const [datePart, timePart] = value.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      `Invalid date-time value: ${value}`,
    );
  }

  return date;
}

function cloneState(state: DomainDemoState): DomainDemoState {
  return {
    domains: state.domains.map((domain) => ({ ...domain })),
    dnsRecords: state.dnsRecords.map((record) => ({ ...record })),
    activities: state.activities.map((activity) => ({ ...activity })),
  };
}

export function resetDemoData(): DomainDemoState {
  return cloneState(domainDemoStateFixture);
}

function toDomainId(id: number | string): number {
  const value = typeof id === "number" ? id : Number(id);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new DomainRepositoryError("INVALID_INPUT", `Invalid domain id: ${id}`);
  }

  return value;
}

function requireDomain(state: DomainDemoState, id: number | string): Subdomain {
  const domainId = toDomainId(id);
  const domain = state.domains.find((item) => item.id === domainId);

  if (!domain) {
    throw new DomainRepositoryError(
      "DOMAIN_NOT_FOUND",
      `Domain ${domainId} was not found`,
    );
  }

  return domain;
}

export function getDomain(
  state: DomainDemoState,
  id: number | string,
): Subdomain | undefined {
  let domainId: number;

  try {
    domainId = toDomainId(id);
  } catch {
    return undefined;
  }

  return state.domains.find((domain) => domain.id === domainId);
}

function normalizeLabel(value: string, field: string): string {
  const normalized = value.trim().toLowerCase().replace(/^\.+|\.+$/g, "");

  if (!normalized) {
    throw new DomainRepositoryError("INVALID_INPUT", `${field} is required`);
  }

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/.test(normalized)) {
    throw new DomainRepositoryError("INVALID_INPUT", `${field} is invalid`);
  }

  return normalized;
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      `${field} must be a positive integer`,
    );
  }

  return value;
}

function createActivity(
  state: DomainDemoState,
  action: ActivityAction,
  domainId: number | null,
  message: string,
  timestamp: string,
): ActivityEntry {
  const sameTimestampCount = state.activities.filter(
    (activity) => activity.created_at === timestamp,
  ).length;

  return {
    id: `activity-${timestamp.replace(/\D/g, "")}-${sameTimestampCount + 1}`,
    domain_id: domainId,
    action,
    message,
    created_at: timestamp,
  };
}

function addYears(value: string, years: number): string {
  const date = parseDateTime(value);
  const originalMonth = date.getMonth();
  date.setFullYear(date.getFullYear() + years);

  if (date.getMonth() !== originalMonth) {
    date.setDate(0);
  }

  return formatDateTime(date);
}

function latestDate(left: string, right: string): string {
  return parseDateTime(left).getTime() >= parseDateTime(right).getTime()
    ? left
    : right;
}

function nextDomainId(domains: readonly Subdomain[]): number {
  return domains.reduce((maximum, domain) => Math.max(maximum, domain.id), 0) + 1;
}

export function addDomain(
  state: DomainDemoState,
  input: AddDomainInput,
  timestamp: string,
): RepositoryResult<Subdomain> {
  parseDateTime(timestamp);

  const subdomain = normalizeLabel(input.subdomain, "subdomain");
  const rootdomain = normalizeLabel(input.rootdomain, "rootdomain");
  const fullDomain = `${subdomain}.${rootdomain}`;

  if (state.domains.some((domain) => domain.full_domain === fullDomain)) {
    throw new DomainRepositoryError(
      "DOMAIN_ALREADY_EXISTS",
      `${fullDomain} already exists`,
    );
  }

  const years = requirePositiveInteger(input.years ?? 1, "years");
  const providerAccountId = requirePositiveInteger(
    input.provider_account_id,
    "provider_account_id",
  );
  const neverExpires = input.never_expires === true;
  const domain: Subdomain = {
    id: nextDomainId(state.domains),
    subdomain,
    rootdomain,
    full_domain: fullDomain,
    status: "Registered",
    created_at: timestamp,
    updated_at: timestamp,
    expires_at: neverExpires ? "9999-12-31 23:59:59" : addYears(timestamp, years),
    never_expires: neverExpires ? 1 : 0,
    cloudflare_zone_id:
      input.cloudflare_zone_id?.trim() || rootdomain,
    provider_account_id: providerAccountId,
  };
  const activity = createActivity(
    state,
    "domain.added",
    domain.id,
    `Added ${domain.full_domain}`,
    timestamp,
  );

  return {
    state: {
      domains: [...state.domains, domain],
      dnsRecords: [...state.dnsRecords],
      activities: [activity, ...state.activities],
    },
    value: domain,
  };
}

export function deleteDomain(
  state: DomainDemoState,
  id: number | string,
  timestamp: string,
): RepositoryResult<Subdomain> {
  parseDateTime(timestamp);
  const domain = requireDomain(state, id);
  const activity = createActivity(
    state,
    "domain.deleted",
    domain.id,
    `Deleted ${domain.full_domain}`,
    timestamp,
  );

  return {
    state: {
      domains: state.domains.filter((item) => item.id !== domain.id),
      dnsRecords: state.dnsRecords.filter(
        (record) => record.domain_id !== domain.id,
      ),
      activities: [activity, ...state.activities],
    },
    value: domain,
  };
}

export function renewDomain(
  state: DomainDemoState,
  id: number | string,
  years: number,
  timestamp: string,
): RepositoryResult<Subdomain> {
  parseDateTime(timestamp);
  requirePositiveInteger(years, "years");
  const currentDomain = requireDomain(state, id);
  const renewalBase = currentDomain.never_expires
    ? timestamp
    : latestDate(currentDomain.expires_at, timestamp);
  const renewedDomain: Subdomain = {
    ...currentDomain,
    status: "Registered",
    expires_at: addYears(renewalBase, years),
    never_expires: 0,
    updated_at: timestamp,
  };
  const activity = createActivity(
    state,
    "domain.renewed",
    currentDomain.id,
    `Renewed ${currentDomain.full_domain} for ${years} year${years === 1 ? "" : "s"}`,
    timestamp,
  );

  return {
    state: {
      domains: state.domains.map((domain) =>
        domain.id === currentDomain.id ? renewedDomain : domain,
      ),
      dnsRecords: [...state.dnsRecords],
      activities: [activity, ...state.activities],
    },
    value: renewedDomain,
  };
}

export function refreshDomain(
  state: DomainDemoState,
  id: number | string,
  timestamp: string,
  status: DomainStatus = "Registered",
): RepositoryResult<Subdomain> {
  parseDateTime(timestamp);
  const currentDomain = requireDomain(state, id);
  const refreshedDomain: Subdomain = {
    ...currentDomain,
    status,
    updated_at: timestamp,
  };
  const activity = createActivity(
    state,
    "domain.refreshed",
    currentDomain.id,
    `Refreshed ${currentDomain.full_domain} status: ${status}`,
    timestamp,
  );

  return {
    state: {
      domains: state.domains.map((domain) =>
        domain.id === currentDomain.id ? refreshedDomain : domain,
      ),
      dnsRecords: [...state.dnsRecords],
      activities: [activity, ...state.activities],
    },
    value: refreshedDomain,
  };
}

export function getDnsRecords(
  state: DomainDemoState,
  domainId: number | string,
): DnsRecord[] {
  const domain = requireDomain(state, domainId);
  return state.dnsRecords.filter((record) => record.domain_id === domain.id);
}

function normalizeDnsInput(input: CreateDnsRecordInput): Required<
  Pick<CreateDnsRecordInput, "type" | "name" | "content" | "ttl" | "proxied">
> & Pick<CreateDnsRecordInput, "priority"> {
  const name = input.name.trim();
  const content = input.content.trim();

  if (!name || !content) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      "DNS name and content are required",
    );
  }

  const ttl = input.ttl ?? 3600;
  requirePositiveInteger(ttl, "ttl");

  if (
    input.priority !== undefined &&
    (!Number.isSafeInteger(input.priority) || input.priority < 0)
  ) {
    throw new DomainRepositoryError(
      "INVALID_INPUT",
      "priority must be a non-negative integer",
    );
  }

  return {
    type: input.type,
    name,
    content,
    ttl,
    proxied: input.proxied ?? false,
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  };
}

export function createDnsRecord(
  state: DomainDemoState,
  domainId: number | string,
  input: CreateDnsRecordInput,
  timestamp: string,
): RepositoryResult<DnsRecord> {
  parseDateTime(timestamp);
  const domain = requireDomain(state, domainId);
  const normalized = normalizeDnsInput(input);
  const sameTimestampCount = state.dnsRecords.filter(
    (record) => record.created_at === timestamp,
  ).length;
  const record: DnsRecord = {
    id: `dns-${domain.id}-${timestamp.replace(/\D/g, "")}-${sameTimestampCount + 1}`,
    domain_id: domain.id,
    ...normalized,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const activity = createActivity(
    state,
    "dns.created",
    domain.id,
    `Created ${record.type} record ${record.name} for ${domain.full_domain}`,
    timestamp,
  );

  return {
    state: {
      domains: [...state.domains],
      dnsRecords: [...state.dnsRecords, record],
      activities: [activity, ...state.activities],
    },
    value: record,
  };
}

function requireDnsRecord(
  state: DomainDemoState,
  domainId: number,
  recordId: string,
): DnsRecord {
  const record = state.dnsRecords.find(
    (item) => item.id === recordId && item.domain_id === domainId,
  );

  if (!record) {
    throw new DomainRepositoryError(
      "DNS_RECORD_NOT_FOUND",
      `DNS record ${recordId} was not found`,
    );
  }

  return record;
}

export function updateDnsRecord(
  state: DomainDemoState,
  domainId: number | string,
  recordId: string,
  input: UpdateDnsRecordInput,
  timestamp: string,
): RepositoryResult<DnsRecord> {
  parseDateTime(timestamp);
  const domain = requireDomain(state, domainId);
  const currentRecord = requireDnsRecord(state, domain.id, recordId);
  const normalized = normalizeDnsInput({
    type: input.type ?? currentRecord.type,
    name: input.name ?? currentRecord.name,
    content: input.content ?? currentRecord.content,
    ttl: input.ttl ?? currentRecord.ttl,
    proxied: input.proxied ?? currentRecord.proxied,
    ...(input.priority === null
      ? {}
      : { priority: input.priority ?? currentRecord.priority }),
  });
  const updatedRecord: DnsRecord = {
    ...currentRecord,
    ...normalized,
    updated_at: timestamp,
  };

  if (input.priority === null) {
    delete updatedRecord.priority;
  }

  const activity = createActivity(
    state,
    "dns.updated",
    domain.id,
    `Updated ${updatedRecord.type} record ${updatedRecord.name} for ${domain.full_domain}`,
    timestamp,
  );

  return {
    state: {
      domains: [...state.domains],
      dnsRecords: state.dnsRecords.map((record) =>
        record.id === currentRecord.id ? updatedRecord : record,
      ),
      activities: [activity, ...state.activities],
    },
    value: updatedRecord,
  };
}

export function deleteDnsRecord(
  state: DomainDemoState,
  domainId: number | string,
  recordId: string,
  timestamp: string,
): RepositoryResult<DnsRecord> {
  parseDateTime(timestamp);
  const domain = requireDomain(state, domainId);
  const record = requireDnsRecord(state, domain.id, recordId);
  const activity = createActivity(
    state,
    "dns.deleted",
    domain.id,
    `Deleted ${record.type} record ${record.name} from ${domain.full_domain}`,
    timestamp,
  );

  return {
    state: {
      domains: [...state.domains],
      dnsRecords: state.dnsRecords.filter((item) => item.id !== record.id),
      activities: [activity, ...state.activities],
    },
    value: record,
  };
}
