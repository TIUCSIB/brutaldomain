import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
} from "@/lib/auth/constants";
import {
  isGitHubUserAllowed,
  readAllowedGitHubUsers,
  requireGitHubAllowlistInProduction,
} from "@/lib/auth/allowed-users";

export interface EdgeSessionPayload {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  provider: "github";
  exp: number;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  return atob(base64);
}

async function sign(payloadEncoded: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadEncoded),
  );
  return toBase64Url(signature);
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export function readEdgeAuthSecret(): string | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const secret = process.env.AUTH_SECRET?.trim() || "";
  const allowedUsers = readAllowedGitHubUsers();

  if (!clientId || !clientSecret || !secret) return null;
  if (requireGitHubAllowlistInProduction() && allowedUsers.length === 0) {
    return null;
  }
  return secret;
}

export async function verifyEdgeSessionToken(
  token: string,
  secret: string,
): Promise<EdgeSessionPayload | null> {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expected = await sign(payloadEncoded, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(
      fromBase64Url(payloadEncoded),
    ) as EdgeSessionPayload;
    if (
      payload.provider !== "github" ||
      typeof payload.username !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    if (!isGitHubUserAllowed(payload.username, readAllowedGitHubUsers())) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${AUTH_COOKIE_NAME}=`)) {
      return decodeURIComponent(part.slice(AUTH_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export { AUTH_COOKIE_NAME, AUTH_SESSION_TTL_SECONDS };
