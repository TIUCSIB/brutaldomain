import { NextResponse } from "next/server";

import {
  getGitHubAuthConfig,
  isAuthConfigured,
  isGitHubUserAllowed,
} from "@/lib/auth/config";
import {
  exchangeGitHubCode,
  fetchGitHubUser,
} from "@/lib/auth/github";
import {
  consumeOAuthState,
  setSessionCookie,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectHome(request: Request, error?: string, nextPath = "/dashboard") {
  const url = new URL("/", request.url);
  if (error) {
    url.searchParams.set("error", error);
  } else {
    return NextResponse.redirect(new URL(nextPath, request.url));
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return redirectHome(request, "oauth_not_configured");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const nextPath = url.searchParams.get("next") || "/dashboard";

  if (oauthError) {
    return redirectHome(request, oauthError);
  }

  if (!(await consumeOAuthState(state))) {
    return redirectHome(request, "invalid_state");
  }

  if (!code) {
    return redirectHome(request, "missing_code");
  }

  try {
    const accessToken = await exchangeGitHubCode(request, code);
    const user = await fetchGitHubUser(accessToken);
    const config = getGitHubAuthConfig();

    if (!isGitHubUserAllowed(user.login, config.allowedUsers)) {
      return redirectHome(request, "forbidden_user");
    }

    await setSessionCookie({
      username: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    });

    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/dashboard";
    return NextResponse.redirect(new URL(safeNext, request.url));
  } catch {
    return redirectHome(request, "oauth_failed");
  }
}
