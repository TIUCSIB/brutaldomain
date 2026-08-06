import "server-only";

import { readGitHubAuthConfig } from "@/lib/auth/config";
import { readCronSecret } from "@/lib/env/notify-env";
import { isRenewBlobConfigured } from "@/lib/renew/renew-state-store";

const DEFAULT_DNSHE_API_BASE_URL = "https://api005.dnshe.com/index.php";

export interface DnsheEnv {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

function normalizeBaseUrl(value: string): string | null {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function readDnsheEnv(): DnsheEnv | null {
  const apiKey = process.env.DNSHE_API_KEY?.trim();
  const apiSecret = process.env.DNSHE_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    return null;
  }

  const baseUrl = normalizeBaseUrl(
    process.env.DNSHE_API_BASE_URL?.trim() || DEFAULT_DNSHE_API_BASE_URL,
  );

  if (!baseUrl) {
    return null;
  }

  return { apiKey, apiSecret, baseUrl };
}

export function isDnsheConfigured(): boolean {
  return readDnsheEnv() !== null;
}

export function getProductionAutoRenewConfigIssues(): string[] {
  if (process.env.NODE_ENV !== "production") return [];

  const issues: string[] = [];
  if (!readGitHubAuthConfig()) {
    issues.push("GitHub OAuth / GITHUB_ALLOWED_USERS is not configured");
  }
  if (!readCronSecret()) {
    issues.push("CRON_SECRET is not configured");
  }
  if (!isRenewBlobConfigured()) {
    issues.push("BLOB_READ_WRITE_TOKEN is not configured");
  }
  if (!readDnsheEnv()) {
    issues.push("DNSHE_API_KEY / DNSHE_API_SECRET are not configured");
  }
  return issues;
}

export function getDnsheEnv(): DnsheEnv {
  const env = readDnsheEnv();

  if (!env) {
    throw new Error(
      "DNSHE API is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET.",
    );
  }

  return env;
}
