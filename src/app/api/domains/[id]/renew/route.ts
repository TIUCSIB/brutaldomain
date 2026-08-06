import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  badRequest,
  logServerError,
  upstreamFailure,
} from "@/lib/api/response";
import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "domains:renew",
    limit: 5,
    message: "续费请求过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return badRequest("Invalid domain id");
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.renewDomain(domainId);
    return NextResponse.json(result);
  } catch (error) {
    logServerError("domains:renew", error);
    return upstreamFailure("域名续费失败");
  }
}
