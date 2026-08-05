import type { Subdomain } from "@/features/domains/types";
import { getExpiryDays } from "@/features/domains/utils";

export interface ExpiryNotifyItem {
  id: number;
  fullDomain: string;
  status: string;
  expiresAt: string;
  remainingDays: number;
  level: "expired" | "critical" | "warning";
}

export function scanExpiryNotifyItems(
  domains: readonly Subdomain[],
  options: {
    windowDays: number;
    includeExpired?: boolean;
    now?: Date;
    limit?: number;
  },
): ExpiryNotifyItem[] {
  const now = options.now ?? new Date();
  const includeExpired = options.includeExpired ?? true;
  const limit = options.limit ?? 50;
  const items: ExpiryNotifyItem[] = [];

  for (const domain of domains) {
    const remainingDays = getExpiryDays(domain, now);
    if (remainingDays === null) continue;
    if (remainingDays > options.windowDays) continue;
    if (!includeExpired && remainingDays < 0) continue;

    let level: ExpiryNotifyItem["level"] = "warning";
    if (remainingDays < 0) level = "expired";
    else if (remainingDays <= 7) level = "critical";

    items.push({
      id: domain.id,
      fullDomain: domain.full_domain,
      status: domain.status,
      expiresAt: domain.expires_at,
      remainingDays,
      level,
    });
  }

  items.sort((left, right) => {
    if (left.remainingDays !== right.remainingDays) {
      return left.remainingDays - right.remainingDays;
    }
    return left.fullDomain.localeCompare(right.fullDomain);
  });

  return items.slice(0, limit);
}

export function formatExpiryNotifyText(input: {
  items: readonly ExpiryNotifyItem[];
  windowDays: number;
  title?: string;
}): string {
  const title = input.title ?? "BrutalDomain 到期提醒";
  if (input.items.length === 0) {
    return `${title}\n窗口：${input.windowDays} 天内\n当前没有需要提醒的域名。`;
  }

  const lines = input.items.map((item) => {
    const remain =
      item.remainingDays < 0
        ? `已过期 ${Math.abs(item.remainingDays)} 天`
        : `剩余 ${item.remainingDays} 天`;
    return `• ${item.fullDomain} · ${remain} · ${item.expiresAt} · ${item.status}`;
  });

  return [
    title,
    `窗口：${input.windowDays} 天内 · 共 ${input.items.length} 个`,
    "",
    ...lines,
  ].join("\n");
}
