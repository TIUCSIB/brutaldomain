import { NextResponse } from "next/server";

import {
  badRequest,
  logServerError,
  upstreamFailure,
} from "@/lib/api/response";
import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { createDnsheClient } from "@/lib/dnshe/client";
import type { DnsheDeleteKeyBody, DnsheDeleteKeyResponse } from "@/lib/dnshe/types";
import { isDnsheConfigured } from "@/lib/env/server-env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "settings:keys:delete",
    limit: 5,
    message: "API Key 删除过于频繁，请稍后再试",
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
    await client.request<DnsheDeleteKeyResponse, DnsheDeleteKeyBody>({
      endpoint: "keys",
      action: "delete",
      method: "POST",
      body: { key_id: keyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("settings:keys-delete", error);
    return upstreamFailure("API Key 删除失败");
  }
}
