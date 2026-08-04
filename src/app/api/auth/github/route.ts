import { NextResponse } from "next/server";

import { AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/auth/constants";
import { isAuthConfigured } from "@/lib/auth/config";
import { buildGitHubAuthorizeUrl } from "@/lib/auth/github";
import { createOAuthState } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get("next");

  if (!isAuthConfigured()) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(url);
  }

  const state = await createOAuthState(nextPath);
  return NextResponse.redirect(buildGitHubAuthorizeUrl(request, state));
}

export async function POST() {
  return NextResponse.json(
    { message: AUTH_NOT_CONFIGURED_MESSAGE },
    { status: 405 },
  );
}
