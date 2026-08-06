import "server-only";

import {
  readAllowedGitHubUsers,
  requireGitHubAllowlistInProduction,
} from "@/lib/auth/allowed-users";

export interface GitHubAuthConfig {
  clientId: string;
  clientSecret: string;
  secret: string;
  allowedUsers: string[];
}

export function readGitHubAuthConfig(): GitHubAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const secret = process.env.AUTH_SECRET?.trim() || "";
  const allowedUsers = readAllowedGitHubUsers();

  if (!clientId || !clientSecret || !secret) return null;
  if (requireGitHubAllowlistInProduction() && allowedUsers.length === 0) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    secret,
    allowedUsers,
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
