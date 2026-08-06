import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import { validateCreateDnsRecordInput } from "@/features/domains/input-validation";
import { readJsonBody } from "@/lib/api/json-body";
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
    key: "domains:dns:create",
    limit: 10,
    message: "DNS 记录创建过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<unknown>(request);
  if (!parsed.ok) return parsed.response;

  const { errors, value } = validateCreateDnsRecordInput(parsed.value);
  if (errors.length > 0) {
    return badRequest(errors[0], errors);
  }

  const repository = new DnsheDomainRepository();

  try {
    const record = await repository.createDnsRecord(domainId, value);
    return NextResponse.json({ record });
  } catch (error) {
    logServerError("domains:dns-create", error);
    return upstreamFailure("DNS 记录创建失败");
  }
}
