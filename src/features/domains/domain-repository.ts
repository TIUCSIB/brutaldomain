import type {
  CreateDnsRecordInput,
  DnsRecord,
  DomainDetailApiResponse,
  DomainFeatures,
  DomainListApiResponse,
  UpdateDnsRecordInput,
  AddDomainInput,
} from "./types";

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
