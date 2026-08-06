import { NextResponse } from "next/server";

import { logServerError, upstreamFailure } from "@/lib/api/response";
import { requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { createDnsheClient } from "@/lib/dnshe/client";
import type { DnsheQuotaResponse } from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:quota",
    limit: 20,
    message: "配额查询过于频繁，请稍后再试",
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE is not configured" },
      { status: 503 },
    );
  }

  const client = createDnsheClient();

  try {
    const result = await client.request<DnsheQuotaResponse>({ endpoint: "quota" });
    return NextResponse.json(result);
  } catch (error) {
    logServerError("settings:quota", error);
    return upstreamFailure("配额查询失败");
  }
}
