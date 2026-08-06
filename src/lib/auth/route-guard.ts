import "server-only";

import { NextResponse } from "next/server";

import { AUTH_FORBIDDEN_MESSAGE, AUTH_UNAUTHORIZED_MESSAGE } from "@/lib/auth/constants";
import { readGitHubAuthConfig } from "@/lib/auth/config";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { isGitHubUserAllowed } from "@/lib/auth/allowed-users";

interface GuardSuccess {
  ok: true;
  session: SessionPayload;
}

interface GuardFailure {
  ok: false;
  response: NextResponse;
}

function unauthorizedResponse() {
  return NextResponse.json(
    { message: AUTH_UNAUTHORIZED_MESSAGE },
    { status: 401 },
  );
}

function forbiddenResponse(message = AUTH_FORBIDDEN_MESSAGE) {
  return NextResponse.json({ message }, { status: 403 });
}

export async function requireAuthenticatedSession(): Promise<
  GuardSuccess | GuardFailure
> {
  const config = readGitHubAuthConfig();
  if (!config) {
    return {
      ok: false,
      response: unauthorizedResponse(),
    };
  }

  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: unauthorizedResponse(),
    };
  }

  if (!isGitHubUserAllowed(session.username, config.allowedUsers)) {
    return {
      ok: false,
      response: forbiddenResponse(),
    };
  }

  return {
    ok: true,
    session,
  };
}

export async function requireAuthenticatedMutation(
  request: Request,
): Promise<GuardSuccess | GuardFailure> {
  const sessionCheck = await requireAuthenticatedSession();
  if (!sessionCheck.ok) return sessionCheck;

  const origin = request.headers.get("origin")?.trim();
  const requestOrigin = new URL(request.url).origin;
  if (!origin || origin !== requestOrigin) {
    return {
      ok: false,
      response: forbiddenResponse("Invalid request origin"),
    };
  }

  return sessionCheck;
}
