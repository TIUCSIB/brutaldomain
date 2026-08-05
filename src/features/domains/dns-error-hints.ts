import { classifyError } from "@/lib/api/request-error";

export function getDnsErrorHint(error: unknown): string {
  const classified = classifyError(error);
  const message = classified.message || "操作失败";

  if (classified.kind === "not_found") {
    return "目标域名或记录不存在（可能已删除）。请刷新详情后重试。";
  }
  if (classified.kind === "config") {
    return "DNSHE 未配置或服务不可用。请检查服务端密钥设置。";
  }
  if (classified.kind === "unauthorized") {
    return "登录已过期，请重新登录后再操作。";
  }
  if (classified.kind === "forbidden") {
    return "当前账号无权限修改该 DNS 记录。";
  }
  if (classified.kind === "rate_limit") {
    return "请求过于频繁，请稍后再试。";
  }

  const lower = message.toLowerCase();
  if (
    classified.status === 409 ||
    /conflict|already exists|duplicate|已存在|冲突/.test(lower)
  ) {
    return "记录可能与现有解析冲突（同名同类型）。请检查是否已有相同记录，或修改名称/类型后重试。";
  }
  if (/invalid|validation|格式|非法/.test(lower)) {
    return "输入内容未通过校验。请检查主机名、记录值、TTL 或 MX 优先级。";
  }
  if (/timeout|network|fetch|网络/.test(lower)) {
    return "网络异常，请检查连接后重试。";
  }

  return message;
}
