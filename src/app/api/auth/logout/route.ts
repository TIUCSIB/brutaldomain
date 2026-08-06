import { NextResponse } from "next/server";

import { requireAuthenticatedMutation } from "@/lib/auth/route-guard";
import { clearSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedMutation(request);
  if (!auth.ok) return auth.response;

  const limited = await enforceRateLimit({
    identifier: auth.session.username,
    key: "auth:logout",
    limit: 5,
    message: "退出登录过于频繁，请稍后再试",
    windowMs: 5 * 60 * 1000,
  });
  if (limited) return limited;

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
