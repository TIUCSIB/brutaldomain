import type { DnsRecordType } from "@/features/domains/types";

export interface DnsheApiErrorResponse {
  success: false;
  error_code?: string;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DnshePagination {
  page?: number;
  per_page?: number;
  has_more?: boolean;
  next_page?: number;
  prev_page?: number;
  total?: number;
}

export interface DnsheSubdomainRecord {
  id: number;
  subdomain: string;
  rootdomain: string;
  full_domain: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  never_expires?: 0 | 1;
  cloudflare_zone_id?: string;
  provider_account_id?: number | null;
}

export interface DnsheListSubdomainsResponse {
  success: true;
  count: number;
  subdomains: DnsheSubdomainRecord[];
  pagination?: DnshePagination;
}

export interface DnsheGetSubdomainResponse {
  success: true;
  subdomain: DnsheSubdomainRecord;
  dns_records?: DnsheDnsRecord[];
  dns_count?: number;
}

export interface DnsheRegisterSubdomainBody {
  subdomain: string;
  rootdomain: string;
}

export interface DnsheRegisterSubdomainResponse {
  success: true;
  message: string;
  subdomain_id: number;
  full_domain: string;
}

export interface DnsheDeleteSubdomainBody {
  subdomain_id: number;
}

export interface DnsheDeleteSubdomainResponse {
  success: true;
  message: string;
  subdomain_id: number;
  full_domain: string;
  dns_records_deleted: number;
}

export interface DnsheRenewSubdomainBody {
  subdomain_id: number;
}

export interface DnsheRenewSubdomainResponse {
  success: true;
  message: string;
  subdomain_id: number;
  subdomain: string;
  previous_expires_at: string;
  new_expires_at: string;
  renewed_at: string;
  never_expires: 0 | 1;
  status: string;
  remaining_days: number;
  charged_amount: string | number;
}

export interface DnsheDnsRecord {
  id: number | string;
  record_id?: string;
  name: string;
  type: DnsRecordType;
  content: string;
  ttl?: number;
  priority?: number | null;
  line?: string | null;
  proxied?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DnsheListDnsRecordsResponse {
  success: true;
  count: number;
  records: DnsheDnsRecord[];
}

export interface DnsheWriteDnsRecordResponse {
  success: true;
  message?: string;
  id?: number | string;
  record_id?: string;
}

export interface DnsheCreateDnsRecordBody {
  subdomain_id: number;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
}

export interface DnsheUpdateDnsRecordBody {
  id?: number;
  record_id?: string;
  type?: DnsRecordType;
  name?: string;
  content?: string;
  ttl?: number;
  priority?: number;
}

export interface DnsheDeleteDnsRecordBody {
  id?: number;
  record_id?: string;
}

export interface DnsheApiKeyItem {
  id: number;
  key_name: string;
  api_key: string;
  status: string;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface DnsheListKeysResponse {
  success: true;
  count: number;
  keys: DnsheApiKeyItem[];
}

export interface DnsheCreateKeyBody {
  key_name: string;
  ip_whitelist?: string;
}

export interface DnsheCreateKeyResponse {
  success: true;
  message: string;
  api_key: string;
  api_secret: string;
  warning?: string;
}

export interface DnsheDeleteKeyBody {
  key_id: number;
}

export interface DnsheDeleteKeyResponse {
  success: true;
  message: string;
}

export interface DnsheRegenerateKeyBody {
  key_id: number;
}

export interface DnsheRegenerateKeyResponse {
  success: true;
  message: string;
  api_key: string;
  api_secret: string;
  warning?: string;
}

export interface DnsheQuotaSummary {
  used: number;
  base: number;
  invite_bonus: number;
  total: number;
  available: number;
}

export interface DnsheQuotaResponse {
  success: true;
  quota: DnsheQuotaSummary;
}

export interface DnsheWhoisRateLimit {
  limit: number;
  remaining: number;
  reset_at: string;
}

export interface DnsheWhoisRegisteredResponse {
  success: true;
  domain: string;
  status: string;
  registered_at: string;
  expires_at: string;
  registrant_email: string;
  nameservers?: string[];
  name_servers?: string[];
  rate_limit?: DnsheWhoisRateLimit;
}

export interface DnsheWhoisUnregisteredResponse {
  success: true;
  domain: string;
  registered: false;
  status: string;
  message: string;
}

export type DnsheWhoisResponse =
  | DnsheWhoisRegisteredResponse
  | DnsheWhoisUnregisteredResponse;
