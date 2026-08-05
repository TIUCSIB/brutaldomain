import {
  DNS_RECORD_TYPES,
  type CreateDnsRecordInput,
  type DnsRecord,
  type DnsRecordType,
} from "@/features/domains/types";

export interface DnsImportRow {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

export interface DnsImportDiffItem {
  row: DnsImportRow;
  status: "create" | "update" | "skip";
  existing?: DnsRecord;
  reason?: string;
}

function isDnsType(value: string): value is DnsRecordType {
  return (DNS_RECORD_TYPES as readonly string[]).includes(value);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "");
}

export function parseDnsCsv(text: string): {
  rows: DnsImportRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { rows: [], errors: ["CSV 为空"] };
  }

  const header = parseCsvLine(lines[0]).map(normalizeHeader);
  const indexOf = (names: string[]) =>
    header.findIndex((cell) => names.includes(cell));

  const typeIdx = indexOf(["type", "类型"]);
  const nameIdx = indexOf(["name", "主机", "主机记录", "host"]);
  const contentIdx = indexOf(["content", "value", "记录值", "内容"]);
  const ttlIdx = indexOf(["ttl"]);
  const proxiedIdx = indexOf(["proxied", "proxy", "代理"]);
  const priorityIdx = indexOf(["priority", "prio", "优先级"]);

  if (typeIdx < 0 || nameIdx < 0 || contentIdx < 0) {
    return {
      rows: [],
      errors: ["CSV 缺少必要列：type / name / content"],
    };
  }

  const rows: DnsImportRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const typeRaw = (cells[typeIdx] ?? "").toUpperCase();
    const name = cells[nameIdx] ?? "";
    const content = cells[contentIdx] ?? "";
    if (!typeRaw && !name && !content) continue;
    if (!isDnsType(typeRaw)) {
      errors.push(`第 ${i + 1} 行：无效类型 ${typeRaw || "(空)"}`);
      continue;
    }
    if (!name || !content) {
      errors.push(`第 ${i + 1} 行：name/content 不能为空`);
      continue;
    }
    const ttlRaw = ttlIdx >= 0 ? Number(cells[ttlIdx] || 300) : 300;
    const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 300;
    const proxiedRaw = proxiedIdx >= 0 ? (cells[proxiedIdx] ?? "") : "";
    const proxied =
      proxiedRaw === "1" ||
      proxiedRaw.toLowerCase() === "true" ||
      proxiedRaw === "是";
    const priorityRaw =
      priorityIdx >= 0 && cells[priorityIdx]
        ? Number(cells[priorityIdx])
        : undefined;
    rows.push({
      type: typeRaw,
      name,
      content,
      ttl,
      proxied,
      ...(priorityRaw !== undefined && Number.isFinite(priorityRaw)
        ? { priority: priorityRaw }
        : {}),
    });
  }

  return { rows, errors };
}

export function buildDnsImportDiff(
  rows: readonly DnsImportRow[],
  existing: readonly DnsRecord[],
): DnsImportDiffItem[] {
  return rows.map((row) => {
    const match = existing.find(
      (record) =>
        record.type === row.type &&
        record.name.toLowerCase() === row.name.toLowerCase(),
    );
    if (!match) {
      return { row, status: "create" as const };
    }
    const sameContent =
      match.content === row.content &&
      match.ttl === row.ttl &&
      match.proxied === row.proxied &&
      (match.priority ?? undefined) === (row.priority ?? undefined);
    if (sameContent) {
      return {
        row,
        status: "skip" as const,
        existing: match,
        reason: "与现有记录完全一致",
      };
    }
    return { row, status: "update" as const, existing: match };
  });
}

export function toCreateInput(row: DnsImportRow): CreateDnsRecordInput {
  return {
    type: row.type,
    name: row.name,
    content: row.content,
    ttl: row.ttl,
    proxied: row.proxied,
    ...(row.priority === undefined ? {} : { priority: row.priority }),
  };
}
