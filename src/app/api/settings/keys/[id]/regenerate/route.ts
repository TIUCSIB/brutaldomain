import { NextResponse } from "next/server";

import {
  badRequest,
  logServerError,
  upstreamFailure,
} from "@/lib/api/response";
import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { createDnsheClient } from "@/lib/dnshe/client";
import type {
  Dnshe重置密钥KeyBody,
  Dnshe重置密钥KeyResponse,
} from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:keys:regenerate",
    limit: 5,
    message: "API Key 重置过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE 服务暂未配置" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const keyId = Number(id);

  if (!Number.isSafeInteger(keyId) || keyId < 1) {
    return badRequest("Invalid key id");
  }

  const client = createDnsheClient();

  try {
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
  } catch (error) {
    logServerError("settings:keys-regenerate", error);
    return upstreamFailure("API Key 重置失败");
  }
}
