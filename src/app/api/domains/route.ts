import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import { validateAddDomainInput } from "@/features/domains/input-validation";
import { readJsonBody } from "@/lib/api/json-body";
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

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.listDomains();
    return NextResponse.json(result);
  } catch (error) {
    logServerError("domains:list", error);
    return upstreamFailure("域名列表获取失败");
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "domains:create",
    limit: 5,
    message: "域名添加过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const parsed = await readJsonBody<unknown>(request);
  if (!parsed.ok) return parsed.response;

  const { errors, value } = validateAddDomainInput(parsed.value);
  if (errors.length > 0) {
    return badRequest(errors[0], errors);
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.registerDomain(value);
    return NextResponse.json(result);
  } catch (error) {
    logServerError("domains:create", error);
    return upstreamFailure("域名添加失败");
  }
}
