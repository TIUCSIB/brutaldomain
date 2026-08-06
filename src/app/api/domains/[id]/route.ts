import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  badRequest,
  logServerError,
  upstreamFailure,
} from "@/lib/api/response";
import { requireAuthenticatedMutation, requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

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
    const result = await repository.getDomain(domainId);
    return NextResponse.json(result);
  } catch (error) {
    logServerError("domains:detail", error);
    return upstreamFailure("域名详情获取失败");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

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

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "domains:delete",
    limit: 5,
    message: "域名删除过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const repository = new DnsheDomainRepository();

  try {
    await repository.deleteDomain(domainId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("domains:delete", error);
    return upstreamFailure("域名删除失败");
  }
}
