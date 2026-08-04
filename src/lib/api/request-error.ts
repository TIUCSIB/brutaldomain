import { AUTH_UNAUTHORIZED_MESSAGE } from "@/lib/auth/constants";
import { isDnsheNotConfiguredMessage } from "@/lib/api/dnshe-config-error";

export type ClientErrorKind =
  | "config"
  | "unauthorized"
  | "forbidden"
  | "rate_limit"
  | "not_found"
  | "network"
  | "unknown";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly kind: ClientErrorKind;

  constructor(message: string, status = 500, kind?: ClientErrorKind) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.kind = kind ?? classifyByStatus(status, message);
  }
}

export function classifyByStatus(
  status: number,
  message?: string | null,
): ClientErrorKind {
  if (isDnsheNotConfiguredMessage(message) || status === 503) {
    if (isDnsheNotConfiguredMessage(message)) return "config";
  }
  if (status === 401 || message === AUTH_UNAUTHORIZED_MESSAGE) {
    return "unauthorized";
  }
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limit";
  if (status === 0) return "network";
  if (isDnsheNotConfiguredMessage(message)) return "config";
  return "unknown";
}

export function classifyError(error: unknown): {
  kind: ClientErrorKind;
  message: string;
  status: number | null;
} {
  if (error instanceof ApiRequestError) {
    return {
      kind: error.kind,
      message: error.message,
      status: error.status,
    };
  }
  if (error instanceof Error) {
    return {
      kind: classifyByStatus(0, error.message),
      message: error.message,
      status: null,
    };
  }
  return {
    kind: "unknown",
    message: "未知错误",
    status: null,
  };
}

export function errorTitle(kind: ClientErrorKind): string {
  switch (kind) {
    case "config":
      return "DNSHE 未配置";
    case "unauthorized":
      return "登录已过期";
    case "forbidden":
      return "无访问权限";
    case "rate_limit":
      return "请求过于频繁";
    case "not_found":
      return "资源不存在";
    case "network":
      return "网络异常";
    default:
      return "请求失败";
  }
}

export function errorHint(kind: ClientErrorKind): string | null {
  switch (kind) {
    case "config":
      return "请在 .env.local 或部署环境中设置 DNSHE_API_KEY 与 DNSHE_API_SECRET。";
    case "unauthorized":
      return "会话已失效，请重新使用 GitHub 登录。";
    case "forbidden":
      return "当前账号不在允许列表中，请联系管理员。";
    case "rate_limit":
      return "已触发限流，请稍后再试。";
    case "network":
      return "请检查网络连接后重试。";
    default:
      return null;
  }
}

/** Redirect browser to login when API reports unauthorized. */
export function redirectIfUnauthorized(error: unknown): boolean {
  const classified = classifyError(error);
  if (classified.kind !== "unauthorized") return false;
  if (typeof window === "undefined") return false;

  const next = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({
    error: "session_expired",
    next,
  });
  window.location.assign(`/?${params.toString()}`);
  return true;
}

export async function readErrorPayload(
  response: Response,
): Promise<{ message?: string; error?: string } | null> {
  return (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;
}

export function messageFromPayload(
  payload: { message?: string; error?: string } | null,
  fallback = "Request failed",
): string {
  return payload?.message || payload?.error || fallback;
}

export function throwApiError(
  response: Response,
  payload: { message?: string; error?: string } | null,
): never {
  const message = messageFromPayload(payload);
  throw new ApiRequestError(message, response.status);
}
