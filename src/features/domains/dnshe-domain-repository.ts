import "server-only";

import { createDnsheClient, DnsheApiError } from "@/lib/dnshe/client";
import {
  mapDnsheDnsRecord,
  mapDnsheSubdomain,
  toDnsheCreateDnsRecordBody,
  toDnsheRecordReference,
  toDnsheUpdateDnsRecordBody,
} from "@/lib/dnshe/mappers";
import type {
  DnsheCreateDnsRecordBody,
  DnsheDeleteDnsRecordBody,
  DnsheDeleteSubdomainBody,
  DnsheDeleteSubdomainResponse,
  DnsheGetSubdomainResponse,
  DnsheListDnsRecordsResponse,
  DnsheListSubdomainsResponse,
  DnsheRegisterSubdomainBody,
  DnsheRegisterSubdomainResponse,
  DnsheRenewSubdomainBody,
  DnsheRenewSubdomainResponse,
  DnsheUpdateDnsRecordBody,
  DnsheWriteDnsRecordResponse,
} from "@/lib/dnshe/types";

import { DNSHE_DOMAIN_FEATURES, type DomainRepository } from "./domain-repository";
import type {
  AddDomainInput,
  CreateDnsRecordInput,
  DnsRecord,
  DomainDetailApiResponse,
  DomainListApiResponse,
  UpdateDnsRecordInput,
} from "./types";

async function listDnsRecordsForDomain(domainId: number): Promise<DnsRecord[]> {
  const client = createDnsheClient();
  const response = await client.request<DnsheListDnsRecordsResponse>({
    endpoint: "dns_records",
    action: "list",
    query: { subdomain_id: domainId },
  });
  return response.records.map((record) => mapDnsheDnsRecord(domainId, record));
}

async function findDnsRecordByResult(
  domainId: number,
  result: DnsheWriteDnsRecordResponse,
): Promise<DnsRecord> {
  const records = await listDnsRecordsForDomain(domainId);
  const matched = records.find(
    (record) =>
      record.id === String(result.id) ||
      record.provider_record_id === result.record_id,
  );

  if (!matched) {
    throw new DnsheApiError(
      "dns_record_not_found",
      "DNSHE did not return the updated record after write.",
      502,
    );
  }

  return matched;
}

export class DnsheDomainRepository implements DomainRepository {
  async listDomains(): Promise<DomainListApiResponse> {
    const client = createDnsheClient();
    const domains = [];
    let page = 1;

    while (true) {
      const response = await client.request<DnsheListSubdomainsResponse>({
        endpoint: "subdomains",
        action: "list",
        query: { page, per_page: 500, fields: "all" },
      });
      domains.push(...response.subdomains.map(mapDnsheSubdomain));

      if (!response.pagination?.has_more) break;
      page = response.pagination.next_page ?? page + 1;
    }

    return { source: "dnshe", features: DNSHE_DOMAIN_FEATURES, domains, activities: [] };
  }

  async getDomain(domainId: number): Promise<DomainDetailApiResponse> {
    const client = createDnsheClient();
    const response = await client.request<DnsheGetSubdomainResponse>({
      endpoint: "subdomains",
      action: "get",
      query: { subdomain_id: domainId },
    });
    const domain = mapDnsheSubdomain(response.subdomain);
    const dnsRecords = await listDnsRecordsForDomain(domain.id);

    return { source: "dnshe", features: DNSHE_DOMAIN_FEATURES, domain, dnsRecords, activities: [] };
  }

  async registerDomain(input: AddDomainInput): Promise<DomainDetailApiResponse> {
    const client = createDnsheClient();
    const response = await client.request<
      DnsheRegisterSubdomainResponse,
      DnsheRegisterSubdomainBody
    >({
      endpoint: "subdomains",
      action: "register",
      method: "POST",
      body: {
        subdomain: input.subdomain.trim(),
        rootdomain: input.rootdomain.trim(),
      },
    });

    return this.getDomain(response.subdomain_id);
  }

  async deleteDomain(domainId: number): Promise<void> {
    const client = createDnsheClient();
    await client.request<DnsheDeleteSubdomainResponse, DnsheDeleteSubdomainBody>({
      endpoint: "subdomains",
      action: "delete",
      method: "POST",
      body: { subdomain_id: domainId },
    });
  }

  async renewDomain(domainId: number): Promise<DomainDetailApiResponse> {
    const client = createDnsheClient();
    await client.request<DnsheRenewSubdomainResponse, DnsheRenewSubdomainBody>({
      endpoint: "subdomains",
      action: "renew",
      method: "POST",
      body: { subdomain_id: domainId },
    });

    return this.getDomain(domainId);
  }

  async createDnsRecord(
    domainId: number,
    input: CreateDnsRecordInput,
  ): Promise<DnsRecord> {
    const client = createDnsheClient();
    const response = await client.request<
      DnsheWriteDnsRecordResponse,
      DnsheCreateDnsRecordBody
    >({
      endpoint: "dns_records",
      action: "create",
      method: "POST",
      body: toDnsheCreateDnsRecordBody(domainId, input),
    });

    return findDnsRecordByResult(domainId, response);
  }

  async updateDnsRecord(
    domainId: number,
    recordId: string,
    input: UpdateDnsRecordInput,
  ): Promise<DnsRecord> {
    const client = createDnsheClient();
    const response = await client.request<
      DnsheWriteDnsRecordResponse,
      DnsheUpdateDnsRecordBody
    >({
      endpoint: "dns_records",
      action: "update",
      method: "POST",
      body: toDnsheUpdateDnsRecordBody(recordId, input),
    });

    return findDnsRecordByResult(domainId, response);
  }

  async deleteDnsRecord(domainId: number, recordId: string): Promise<void> {
    const client = createDnsheClient();
    await client.request<DnsheWriteDnsRecordResponse, DnsheDeleteDnsRecordBody>({
      endpoint: "dns_records",
      action: "delete",
      method: "POST",
      body: toDnsheRecordReference(recordId),
    });

    await listDnsRecordsForDomain(domainId);
  }
}
