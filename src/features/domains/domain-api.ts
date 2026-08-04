import { throwApiError } from "@/lib/api/request-error";

import type {
  AddDomainInput,
  CreateDnsRecordInput,
  DnsRecord,
  DomainDetailApiResponse,
  DomainListApiResponse,
  UpdateDnsRecordInput,
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

export function fetchDomains(): Promise<DomainListApiResponse> {
  return requestJson<DomainListApiResponse>("/api/domains");
}

export function createDomainRequest(
  input: AddDomainInput,
): Promise<DomainDetailApiResponse> {
  return requestJson<DomainDetailApiResponse>("/api/domains", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchDomainById(
  domainId: number | string,
): Promise<DomainDetailApiResponse> {
  return requestJson<DomainDetailApiResponse>(`/api/domains/${domainId}`);
}

export function deleteDomainRequest(domainId: number | string): Promise<void> {
  return requestJson(`/api/domains/${domainId}`, { method: "DELETE" });
}

export function renewDomainRequest(
  domainId: number | string,
): Promise<DomainDetailApiResponse> {
  return requestJson<DomainDetailApiResponse>(`/api/domains/${domainId}/renew`, {
    method: "POST",
  });
}

export function createDnsRecordRequest(
  domainId: number | string,
  input: CreateDnsRecordInput,
): Promise<{ record: DnsRecord }> {
  return requestJson<{ record: DnsRecord }>(`/api/domains/${domainId}/dns`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDnsRecordRequest(
  domainId: number | string,
  recordId: string,
  input: UpdateDnsRecordInput,
): Promise<{ record: DnsRecord }> {
  return requestJson<{ record: DnsRecord }>(
    `/api/domains/${domainId}/dns/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteDnsRecordRequest(
  domainId: number | string,
  recordId: string,
): Promise<void> {
  return requestJson(`/api/domains/${domainId}/dns/${recordId}`, {
    method: "DELETE",
  });
}

