import type {
  CreateDnsRecordInput,
  DnsRecord,
  DomainStatus,
  Subdomain,
  UpdateDnsRecordInput,
} from "@/features/domains/types";

import type {
  DnsheCreateDnsRecordBody,
  DnsheDeleteDnsRecordBody,
  DnsheDnsRecord,
  DnsheSubdomainRecord,
  DnsheUpdateDnsRecordBody,
} from "./types";

function fallbackDate(value?: string): string {
  return value ?? "";
}

export function mapDnsheDomainStatus(status?: string): DomainStatus {
  switch (status?.trim().toLowerCase()) {
    case "active":
    case "registered":
      return "Registered";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "expired":
      return "Expired";
    default:
      return "Error";
  }
}

export function mapDnsheSubdomain(record: DnsheSubdomainRecord): Subdomain {
  return {
    id: record.id,
    subdomain: record.subdomain,
    rootdomain: record.rootdomain,
    full_domain: record.full_domain,
    status: mapDnsheDomainStatus(record.status),
    created_at: fallbackDate(record.created_at),
    updated_at: fallbackDate(record.updated_at),
    expires_at: fallbackDate(record.expires_at),
    never_expires: record.never_expires ?? 0,
    cloudflare_zone_id: record.cloudflare_zone_id ?? record.rootdomain,
    provider_account_id: record.provider_account_id ?? null,
  };
}

export function mapDnsheDnsRecord(
  domainId: number,
  record: DnsheDnsRecord,
): DnsRecord {
  return {
    id: String(record.id),
    provider_record_id: record.record_id,
    domain_id: domainId,
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl ?? 600,
    proxied: record.proxied ?? false,
    priority: record.priority ?? undefined,
    line: record.line ?? undefined,
    status: record.status,
    created_at: fallbackDate(record.created_at),
    updated_at: fallbackDate(record.updated_at ?? record.created_at),
  };
}

export function toDnsheCreateDnsRecordBody(
  domainId: number,
  input: CreateDnsRecordInput,
): DnsheCreateDnsRecordBody {
  return {
    subdomain_id: domainId,
    type: input.type,
    name: input.name,
    content: input.content,
    ...(input.ttl ? { ttl: input.ttl } : {}),
    ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
  };
}

export function toDnsheUpdateDnsRecordBody(
  recordId: string,
  input: UpdateDnsRecordInput,
): DnsheUpdateDnsRecordBody {
  return {
    ...toDnsheRecordReference(recordId),
    ...(input.type ? { type: input.type } : {}),
    ...(typeof input.name === "string" ? { name: input.name } : {}),
    ...(typeof input.content === "string" ? { content: input.content } : {}),
    ...(typeof input.ttl === "number" ? { ttl: input.ttl } : {}),
    ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
  };
}

export function toDnsheRecordReference(
  recordId: string,
): DnsheDeleteDnsRecordBody {
  return /^\d+$/.test(recordId)
    ? { id: Number(recordId) }
    : { record_id: recordId };
}
