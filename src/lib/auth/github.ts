import "server-only";

import { getGitHubAuthConfig } from "@/lib/auth/config";

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
}

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto || url.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return url.origin;
}

export function getGitHubCallbackUrl(request: Request): string {
  return `${getOrigin(request)}/api/auth/callback`;
}

export function buildGitHubAuthorizeUrl(
  request: Request,
  state: string,
): string {
  const config = getGitHubAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getGitHubCallbackUrl(request),
    scope: "read:user",
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(
  request: Request,
  code: string,
): Promise<string> {
  const config = getGitHubAuthConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getGitHubCallbackUrl(request),
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Failed to exchange GitHub authorization code",
    );
  }

  return payload.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "BrutalDomain",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load GitHub user profile");
  }

  const payload = (await response.json()) as GitHubUser;
  if (!payload.login) {
    throw new Error("GitHub user profile is incomplete");
  }

  return payload;
}
