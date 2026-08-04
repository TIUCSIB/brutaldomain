import { NextResponse } from "next/server";

import { createDnsheClient } from "@/lib/dnshe/client";
import type {
  Dnshe重置密钥KeyBody,
  Dnshe重置密钥KeyResponse,
} from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isDnsheConfigured()) {
    return NextResponse.json({ message: "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET." }, { status: 503 });
  }

  const { id } = await context.params;
  const keyId = Number(id);

  if (!Number.isSafeInteger(keyId) || keyId < 1) {
    return NextResponse.json({ message: "Invalid key id" }, { status: 400 });
  }

  const client = createDnsheClient();
  const result = await client.request<
    Dnshe重置密钥KeyResponse,
    Dnshe重置密钥KeyBody
  >({
    endpoint: "keys",
    action: "regenerate",
    method: "POST",
    body: { key_id: keyId },
  });

  return NextResponse.json(result);
}
