import type { DnsRecord } from "@/features/domains/types";

export function dnsRecordsToCsv(records: readonly DnsRecord[]): string {
  const header = [
    "id",
    "type",
    "name",
    "content",
    "ttl",
    "proxied",
    "priority",
    "status",
    "created_at",
    "updated_at",
  ];
  const escape = (value: string | number | boolean | null | undefined) => {
    const text =
      value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };
  const rows = records.map((record) =>
    [
      record.id,
      record.type,
      record.name,
      record.content,
      record.ttl,
      record.proxied ? "1" : "0",
      record.priority ?? "",
      record.status ?? "",
      record.created_at,
      record.updated_at,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
) {
  const blob = new Blob([`\uFEFF${content}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
