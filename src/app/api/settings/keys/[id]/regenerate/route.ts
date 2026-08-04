import { NextResponse } from "next/server";

import { createDnsheClient } from "@/lib/dnshe/client";
import type {
  DnsheRegenerateKeyBody,
  DnsheRegenerateKeyResponse,
} from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE API is not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  const keyId = Number(id);

  if (!Number.isSafeInteger(keyId) || keyId < 1) {
    return NextResponse.json({ message: "Invalid key id" }, { status: 400 });
  }

  const client = createDnsheClient();
  const result = await client.request<
    DnsheRegenerateKeyResponse,
    DnsheRegenerateKeyBody
  >({
    endpoint: "keys",
    action: "regenerate",
    method: "POST",
    body: { key_id: keyId },
  });

  return NextResponse.json(result);
}
