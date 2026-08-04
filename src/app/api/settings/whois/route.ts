import { NextResponse } from "next/server";

import { createDnsheClient } from "@/lib/dnshe/client";
import type { DnsheWhoisResponse } from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim();

  if (!domain) {
    return NextResponse.json({ message: "domain is required" }, { status: 400 });
  }

  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE API is not configured" }, { status: 503 });
  }

  const client = createDnsheClient();
  const result = await client.request<DnsheWhoisResponse>({
    endpoint: "whois",
    query: { domain },
  });

  return NextResponse.json({
    domain: result.domain,
    status: result.status,
    registered: !("registered" in result && result.registered === false),
    registered_at: "registered_at" in result ? result.registered_at : undefined,
    expires_at: "expires_at" in result ? result.expires_at : undefined,
    registrant_email:
      "registrant_email" in result ? result.registrant_email : undefined,
    nameservers:
      "nameservers" in result
        ? result.nameservers
        : "name_servers" in result
          ? result.name_servers
          : undefined,
    rate_limit: "rate_limit" in result ? result.rate_limit : undefined,
    message: "message" in result ? result.message : undefined,
  });
}
