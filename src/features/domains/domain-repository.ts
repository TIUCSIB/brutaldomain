import type {
  ActivityEntry,
  AddDomainInput,
  CreateDnsRecordInput,
  DnsRecord,
  DomainDetailApiResponse,
  DomainFeatures,
  DomainListApiResponse,
  DomainSource,
  Subdomain,
  UpdateDnsRecordInput,
} from "./types";

export const MOCK_DOMAIN_FEATURES: DomainFeatures = {
  domainCreate: true,
  domainDelete: true,
  domainRenew: true,
  domainRefresh: true,
  dnsWrite: true,
  activityLog: true,
  proxyEditing: true,
};

export const DNSHE_DOMAIN_FEATURES: DomainFeatures = {
  domainCreate: true,
  domainDelete: true,
  domainRenew: true,
  domainRefresh: false,
  dnsWrite: true,
  activityLog: false,
  proxyEditing: false,
};

export interface DomainRepository {
  listDomains(): Promise<DomainListApiResponse>;
  getDomain(domainId: number): Promise<DomainDetailApiResponse>;
  registerDomain(input: AddDomainInput): Promise<DomainDetailApiResponse>;
  deleteDomain(domainId: number): Promise<void>;
  renewDomain(domainId: number): Promise<DomainDetailApiResponse>;
  createDnsRecord(
    domainId: number,
    input: CreateDnsRecordInput,
  ): Promise<DnsRecord>;
  updateDnsRecord(
    domainId: number,
    recordId: string,
    input: UpdateDnsRecordInput,
  ): Promise<DnsRecord>;
  deleteDnsRecord(domainId: number, recordId: string): Promise<void>;
}

export function getDomainFeatures(source: DomainSource): DomainFeatures {
  return source === "dnshe" ? DNSHE_DOMAIN_FEATURES : MOCK_DOMAIN_FEATURES;
}

export function createMockDomainListResponse(
  domains: Subdomain[],
  activities: ActivityEntry[],
): DomainListApiResponse {
  return {
    source: "mock",
    features: MOCK_DOMAIN_FEATURES,
    domains,
    activities,
  };
}

export function createMockDomainDetailResponse(
  domain: Subdomain,
  dnsRecords: DnsRecord[],
  activities: ActivityEntry[],
): DomainDetailApiResponse {
  return {
    source: "mock",
    features: MOCK_DOMAIN_FEATURES,
    domain,
    dnsRecords,
    activities,
  };
}
