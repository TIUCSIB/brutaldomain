import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  AUTH_NEXT_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_TTL_SECONDS,
} from "@/lib/auth/constants";
import { isGitHubUserAllowed } from "@/lib/auth/allowed-users";
import { getGitHubAuthConfig, readGitHubAuthConfig } from "@/lib/auth/config";

export interface SessionPayload {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  provider: "github";
  exp: number;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payloadEncoded: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadEncoded).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(
  input: Omit<SessionPayload, "exp" | "provider">,
  secret: string,
): string {
  const payload: SessionPayload = {
    ...input,
    provider: "github",
    exp: Math.floor(Date.now() / 1000) + AUTH_SESSION_TTL_SECONDS,
  };
  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
): SessionPayload | null {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expected = sign(payloadEncoded, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as SessionPayload;
    if (
      payload.provider !== "github" ||
      typeof payload.username !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const config = readGitHubAuthConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token, config.secret);
  if (!session) return null;
  if (!isGitHubUserAllowed(session.username, config.allowedUsers)) return null;
  return session;
}

export async function setSessionCookie(
  input: Omit<SessionPayload, "exp" | "provider">,
): Promise<void> {
  const config = getGitHubAuthConfig();
  const token = createSessionToken(input, config.secret);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

function isSafeNextPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export async function createOAuthState(nextPath?: string | null): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(AUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_STATE_TTL_SECONDS,
  });

  if (isSafeNextPath(nextPath)) {
    cookieStore.set(AUTH_NEXT_COOKIE_NAME, nextPath, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_STATE_TTL_SECONDS,
    });
  } else {
    cookieStore.set(AUTH_NEXT_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return state;
}

export async function consumeOAuthState(
  incomingState: string | null,
): Promise<{ ok: boolean; nextPath: string }> {
  const fallback = { ok: false, nextPath: "/dashboard" };
  if (!incomingState) return fallback;

  const cookieStore = await cookies();
  const stored = cookieStore.get(AUTH_STATE_COOKIE_NAME)?.value;
  const nextRaw = cookieStore.get(AUTH_NEXT_COOKIE_NAME)?.value ?? null;

  cookieStore.set(AUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(AUTH_NEXT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!stored) return fallback;
  if (!safeEqual(stored, incomingState)) return fallback;

  return {
    ok: true,
    nextPath: isSafeNextPath(nextRaw) ? nextRaw : "/dashboard",
  };
}
