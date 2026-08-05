export const DOMAIN_STATUSES = [
  "Registered",
  "Pending",
  "Suspended",
  "Expired",
  "Error",
] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export interface Subdomain {
  id: number;
  subdomain: string;
  rootdomain: string;
  full_domain: string;
  status: DomainStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
  never_expires: 0 | 1;
  cloudflare_zone_id: string | null;
  provider_account_id: number | null;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface SubdomainListResponse {
  success: boolean;
  count: number;
  subdomains: Subdomain[];
  pagination?: Pagination;
}

export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "CAA",
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export interface DnsRecord {
  id: string;
  provider_record_id?: string;
  domain_id: number;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
  line?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export const ACTIVITY_ACTIONS = [
  "domain.added",
  "domain.deleted",
  "domain.renewed",
  "domain.refreshed",
  "dns.created",
  "dns.updated",
  "dns.deleted",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ActivityEntry {
  id: string;
  domain_id: number | null;
  action: ActivityAction;
  message: string;
  created_at: string;
}

export interface AddDomainInput {
  subdomain: string;
  rootdomain: string;
}

export interface CreateDnsRecordInput {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

export interface UpdateDnsRecordInput {
  type?: DnsRecordType;
  name?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number | null;
}

export interface DomainState {
  domains: Subdomain[];
  dnsRecords: DnsRecord[];
  activities: ActivityEntry[];
}

export interface DomainFeatures {
  domainCreate: boolean;
  domainDelete: boolean;
  domainRenew: boolean;
  domainRefresh: boolean;
  dnsWrite: boolean;
  activityLog: boolean;
  proxyEditing: boolean;
}

export interface DomainListApiResponse {
  features: DomainFeatures;
  domains: Subdomain[];
  activities: ActivityEntry[];
}

export interface DomainDetailApiResponse {
  features: DomainFeatures;
  domain: Subdomain;
  dnsRecords: DnsRecord[];
  activities: ActivityEntry[];
}

export interface DomainStoreValue {
  features: DomainFeatures;
  domains: Subdomain[];
  activities: ActivityEntry[];
  hydrated: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  getDomain: (id: number | string) => Subdomain | undefined;
  getDnsRecords: (domainId: number | string) => DnsRecord[];
  hasDomainDetailCache: (id: number | string) => boolean;
  isDomainDetailLoading: (id: number | string) => boolean;
  refreshDomains: () => Promise<void>;
  refreshDomainDetail: (
    id: number | string,
    options?: { force?: boolean },
  ) => Promise<Subdomain | undefined>;
  addDomain: (input: AddDomainInput) => Promise<Subdomain>;
  deleteDomain: (id: number | string) => Promise<void>;
  renewDomain: (id: number | string) => Promise<Subdomain>;
  refreshDomain: (id: number | string) => Promise<Subdomain>;
  createDnsRecord: (
    domainId: number | string,
    input: CreateDnsRecordInput,
  ) => Promise<DnsRecord>;
  updateDnsRecord: (
    domainId: number | string,
    recordId: string,
    input: UpdateDnsRecordInput,
  ) => Promise<DnsRecord>;
  deleteDnsRecord: (domainId: number | string, recordId: string) => Promise<void>;
}
