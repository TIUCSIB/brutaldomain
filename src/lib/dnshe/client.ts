import "server-only";

import { getDnsheEnv } from "@/lib/env/server-env";

import type { DnsheApiErrorResponse } from "./types";

export class DnsheApiError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DnsheApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface DnsheRequestOptions<TBody> {
  endpoint: string;
  action?: string;
  body?: TBody;
  method?: "GET" | "POST";
  query?: Record<string, QueryValue>;
}

function buildDnsheUrl(
  baseUrl: string,
  endpoint: string,
  action?: string,
  query?: Record<string, QueryValue>,
): URL {
  const url = new URL(baseUrl);
  url.searchParams.set("m", "domain_hub");
  url.searchParams.set("endpoint", endpoint);

  if (action) {
    url.searchParams.set("action", action);
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export class DnsheClient {
  async request<TResult, TBody = undefined>({
    endpoint,
    action,
    body,
    method = "GET",
    query,
  }: DnsheRequestOptions<TBody>): Promise<TResult> {
    const env = getDnsheEnv();
    const url = buildDnsheUrl(env.baseUrl, endpoint, action, query);

    const response = await fetch(url, {
      method,
      cache: "no-store",
      headers: {
        "X-API-Key": env.apiKey,
        "X-API-Secret": env.apiSecret,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const payload = (await response
      .json()
      .catch(() => null)) as TResult | DnsheApiErrorResponse | null;

    if (
      !response.ok ||
      (payload &&
        typeof payload === "object" &&
        "success" in payload &&
        payload.success === false)
    ) {
      const error = payload as DnsheApiErrorResponse | null;
      throw new DnsheApiError(
        error?.error_code || `HTTP_${response.status}`,
        error?.message || error?.error || "DNSHE request failed",
        response.status,
        error?.details,
      );
    }

    if (payload === null) {
      throw new DnsheApiError(
        "INVALID_RESPONSE",
        "DNSHE API returned an empty response",
        response.status,
      );
    }

    return payload as TResult;
  }
}

export function createDnsheClient(): DnsheClient {
  return new DnsheClient();
}
