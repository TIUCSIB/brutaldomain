import { NextResponse } from "next/server";

import { validateCreateKeyInput } from "@/features/domains/input-validation";
import { readJsonBody } from "@/lib/api/json-body";
import {
  badRequest,
  logServerError,
  upstreamFailure,
} from "@/lib/api/response";
import { requireAuthenticatedMutation, requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { createDnsheClient } from "@/lib/dnshe/client";
import type {
  DnsheCreateKeyBody,
  DnsheCreateKeyResponse,
  DnsheListKeysResponse,
} from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE 服务暂未配置" },
      { status: 503 },
    );
  }

  const client = createDnsheClient();

  try {
    const result = await client.request<DnsheListKeysResponse>({
      endpoint: "keys",
      action: "list",
    });

    return NextResponse.json({ keys: result.keys });
  } catch (error) {
    logServerError("settings:keys-list", error);
    return upstreamFailure("API Key 列表获取失败");
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:keys:create",
    limit: 5,
    message: "API Key 创建过于频繁，请稍后再试",
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE 服务暂未配置" },
      { status: 503 },
    );
  }

  const parsed = await readJsonBody<unknown>(request);
  if (!parsed.ok) return parsed.response;

  const { errors, value } = validateCreateKeyInput(parsed.value);
  if (errors.length > 0) {
    return badRequest(errors[0], errors);
  }

  const client = createDnsheClient();

  try {
    const result = await client.request<DnsheCreateKeyResponse, DnsheCreateKeyBody>({
      endpoint: "keys",
      action: "create",
      method: "POST",
      body: value,
    });

    return NextResponse.json(result);
  } catch (error) {
    logServerError("settings:keys-create", error);
    return upstreamFailure("API Key 创建失败");
  }
}
