import { NextResponse } from "next/server";

import { validateWhoisDomain } from "@/features/domains/input-validation";
import { badRequest, logServerError, upstreamFailure } from "@/lib/api/response";
import { requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { createDnsheClient } from "@/lib/dnshe/client";
import type { DnsheWhoisResponse } from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:whois",
    limit: 20,
    message: "WHOIS 请求过于频繁，请稍后再试",
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim() ?? "";
  const errors = validateWhoisDomain(domain);

  if (errors.length > 0) {
    return badRequest(errors[0], errors);
  }

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE 服务暂未配置" },
      { status: 503 },
    );
  }

  const client = createDnsheClient();

  try {
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
  } catch (error) {
    logServerError("settings:whois", error);
    return upstreamFailure("WHOIS 查询失败");
  }
}
