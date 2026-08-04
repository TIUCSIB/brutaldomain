import "server-only";

const DEFAULT_DNSHE_API_BASE_URL = "https://api005.dnshe.com/index.php";

export interface DnsheEnv {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  return url.toString();
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

  return { apiKey, apiSecret, baseUrl };
}

export function isDnsheConfigured(): boolean {
  return readDnsheEnv() !== null;
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
