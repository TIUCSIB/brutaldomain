import { NextResponse } from "next/server";

import { isAuthConfigured } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      provider: "github",
    });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      configured: true,
      provider: "github",
    });
  }

  return NextResponse.json({
    authenticated: true,
    configured: true,
    provider: "github",
    username: session.username,
    name: session.name,
    avatarUrl: session.avatarUrl,
  });
}
