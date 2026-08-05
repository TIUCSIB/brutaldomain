import type { WhoisHistoryEntry } from "@/features/settings/whois-history";
import type { WhoisLookupResult } from "@/features/settings/types";

export interface WhoisDiffLine {
  field: string;
  before: string;
  after: string;
}

function normalizeList(values?: string[]) {
  return (values ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(", ");
}

export function diffWhois(
  previous: WhoisHistoryEntry | null | undefined,
  current: WhoisLookupResult,
): WhoisDiffLine[] {
  if (!previous) return [];
  const lines: WhoisDiffLine[] = [];
  const push = (field: string, before: string, after: string) => {
    if (before === after) return;
    lines.push({ field, before: before || "—", after: after || "—" });
  };

  push(
    "注册状态",
    previous.registered ? "已注册" : "未注册",
    current.registered ? "已注册" : "未注册",
  );
  push("状态", previous.status || "", current.status || "");
  push("到期时间", previous.expires_at || "", current.expires_at || "");
  push(
    "名称服务器",
    normalizeList(previous.nameservers),
    normalizeList(current.nameservers),
  );
  return lines;
}

export function whoisResultToExportText(result: WhoisLookupResult): string {
  const lines = [
    `domain: ${result.domain}`,
    `registered: ${result.registered ? "yes" : "no"}`,
    `status: ${result.status}`,
    `registered_at: ${result.registered_at ?? ""}`,
    `expires_at: ${result.expires_at ?? ""}`,
    `registrant_email: ${result.registrant_email ?? ""}`,
    `nameservers: ${(result.nameservers ?? []).join(" | ")}`,
    `message: ${result.message ?? ""}`,
  ];
  return lines.join("\n");
}

export function whoisBatchTemplate(): string {
  return ["example.com", "example.org"].join("\n");
}
