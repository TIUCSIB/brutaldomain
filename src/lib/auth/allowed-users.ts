export function parseAllowedUsers(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function readAllowedGitHubUsers(): string[] {
  return parseAllowedUsers(
    process.env.GITHUB_ALLOWED_USERS || process.env.AUTH_ALLOWED_GITHUB_USERS,
  );
}

export function isGitHubUserAllowed(
  login: string,
  allowedUsers: string[],
): boolean {
  if (allowedUsers.length === 0) return true;
  return allowedUsers.includes(login.trim().toLowerCase());
}

export function requireGitHubAllowlistInProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
