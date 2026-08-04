export interface SettingsApiKey {
  id: number;
  key_name: string;
  api_key: string;
  status: string;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface SettingsKeysResponse {
  keys: SettingsApiKey[];
}

export interface SettingsKeySecretResponse {
  message: string;
  api_key: string;
  api_secret: string;
  warning?: string;
}

export interface SettingsQuota {
  used: number;
  base: number;
  invite_bonus: number;
  total: number;
  available: number;
}

export interface SettingsQuotaResponse {
  quota: SettingsQuota;
}

export interface WhoisRateLimit {
  limit: number;
  remaining: number;
  reset_at: string;
}

export interface WhoisLookupResult {
  domain: string;
  status: string;
  registered: boolean;
  registered_at?: string;
  expires_at?: string;
  registrant_email?: string;
  nameservers?: string[];
  rate_limit?: WhoisRateLimit;
  message?: string;
}
