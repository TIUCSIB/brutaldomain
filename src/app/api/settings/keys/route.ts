import { NextResponse } from "next/server";

import { createDnsheClient } from "@/lib/dnshe/client";
import type {
  DnsheCreateKeyBody,
  DnsheCreateKeyResponse,
  DnsheListKeysResponse,
} from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET." }, { status: 503 });
  }

  const client = createDnsheClient();
  const result = await client.request<DnsheListKeysResponse>({
    endpoint: "keys",
    action: "list",
  });

  return NextResponse.json({ keys: result.keys });
}

export async function POST(request: Request) {
  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET." }, { status: 503 });
  }

  const input = (await request.json()) as DnsheCreateKeyBody;
  const client = createDnsheClient();
  const result = await client.request<DnsheCreateKeyResponse, DnsheCreateKeyBody>({
    endpoint: "keys",
    action: "create",
    method: "POST",
    body: input,
  });

  return NextResponse.json(result);
}
