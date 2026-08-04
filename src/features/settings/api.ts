import { throwApiError } from "@/lib/api/request-error";

import type {
  SettingsKeySecretResponse,
  SettingsKeysResponse,
  SettingsQuotaResponse,
  WhoisLookupResult,
} from "./types";

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    throwApiError(
      response,
      payload && typeof payload === "object"
        ? (payload as { message?: string; error?: string })
        : null,
    );
  }

  if (payload === null) {
    throwApiError(response, { message: "Empty response" });
  }
  return payload as T;
}

export function fetchKeys(): Promise<SettingsKeysResponse> {
  return requestJson<SettingsKeysResponse>("/api/settings/keys");
}

export function createKey(input: {
  key_name: string;
  ip_whitelist?: string;
}): Promise<SettingsKeySecretResponse> {
  return requestJson<SettingsKeySecretResponse>("/api/settings/keys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteKey(keyId: number): Promise<void> {
  return requestJson(`/api/settings/keys/${keyId}`, { method: "DELETE" });
}

export function regenerateKey(
  keyId: number,
): Promise<SettingsKeySecretResponse> {
  return requestJson<SettingsKeySecretResponse>(
    `/api/settings/keys/${keyId}/regenerate`,
    { method: "POST" },
  );
}

export function fetchQuota(): Promise<SettingsQuotaResponse> {
  return requestJson<SettingsQuotaResponse>("/api/settings/quota");
}

export function lookupWhois(domain: string): Promise<WhoisLookupResult> {
  const query = new URLSearchParams({ domain });
  return requestJson<WhoisLookupResult>(`/api/settings/whois?${query}`);
}
