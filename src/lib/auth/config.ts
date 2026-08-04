import "server-only";

export interface GitHubAuthConfig {
  clientId: string;
  clientSecret: string;
  secret: string;
  allowedUsers: string[];
}

function parseAllowedUsers(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function readGitHubAuthConfig(): GitHubAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.DNSHE_API_SECRET?.trim() ||
    "";

  if (!clientId || !clientSecret || !secret) return null;

  return {
    clientId,
    clientSecret,
    secret,
    allowedUsers: parseAllowedUsers(
      process.env.GITHUB_ALLOWED_USERS || process.env.AUTH_ALLOWED_GITHUB_USERS,
    ),
  };
}

export function isAuthConfigured(): boolean {
  return readGitHubAuthConfig() !== null;
}

export function getGitHubAuthConfig(): GitHubAuthConfig {
  const config = readGitHubAuthConfig();
  if (!config) {
    throw new Error(
      "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and AUTH_SECRET.",
    );
  }
  return config;
}

export function isGitHubUserAllowed(
  login: string,
  allowedUsers: string[],
): boolean {
  if (allowedUsers.length === 0) return true;
  return allowedUsers.includes(login.trim().toLowerCase());
}
