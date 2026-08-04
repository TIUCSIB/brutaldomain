export const AUTH_COOKIE_NAME = "brutaldomain_session";
export const AUTH_STATE_COOKIE_NAME = "brutaldomain_oauth_state";
export const AUTH_NEXT_COOKIE_NAME = "brutaldomain_oauth_next";
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const AUTH_STATE_TTL_SECONDS = 60 * 10;

export const AUTH_NOT_CONFIGURED_MESSAGE =
  "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and AUTH_SECRET.";

export const AUTH_UNAUTHORIZED_MESSAGE =
  "需要登录后才能访问";

export const AUTH_FORBIDDEN_MESSAGE =
  "This GitHub account is not allowed to access the console.";
