import { describe, expect, it } from "vitest";

import {
  buildDnsImportDiff,
  parseDnsCsv,
} from "@/features/domains/dns-import";
import type { DnsRecord } from "@/features/domains/types";

const baseRecord = {
  id: "1",
  domain_id: 1,
  type: "A" as const,
  name: "www",
  content: "1.1.1.1",
  ttl: 300,
  proxied: false,
  created_at: "2026-01-01 00:00:00",
  updated_at: "2026-01-01 00:00:00",
} satisfies DnsRecord;

describe("parseDnsCsv", () => {
  it("parses standard headers", () => {
    const csv = [
      "type,name,content,ttl,proxied,priority",
      "A,www,1.2.3.4,600,0,",
      "MX,@,mail.example.com,3600,0,10",
    ].join("\n");
    const { rows, errors } = parseDnsCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: "A",
      name: "www",
      content: "1.2.3.4",
      ttl: 600,
    });
    expect(rows[1].priority).toBe(10);
  });
});

describe("buildDnsImportDiff", () => {
  it("marks create/update/skip", () => {
    const diff = buildDnsImportDiff(
      [
        { type: "A", name: "www", content: "1.1.1.1", ttl: 300, proxied: false },
        { type: "A", name: "www", content: "2.2.2.2", ttl: 300, proxied: false },
        { type: "A", name: "api", content: "3.3.3.3", ttl: 300, proxied: false },
      ],
      [baseRecord],
    );
    expect(diff[0].status).toBe("skip");
    expect(diff[1].status).toBe("update");
    expect(diff[2].status).toBe("create");
  });
});
