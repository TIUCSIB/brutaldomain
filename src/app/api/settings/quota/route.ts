import { NextResponse } from "next/server";

import { createDnsheClient } from "@/lib/dnshe/client";
import type { DnsheQuotaResponse } from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET." }, { status: 503 });
  }

  const client = createDnsheClient();
  const result = await client.request<DnsheQuotaResponse>({ endpoint: "quota" });
  return NextResponse.json(result);
}
