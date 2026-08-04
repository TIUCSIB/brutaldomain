import { describe, expect, it } from "vitest";

import { dnsRecordsToCsv } from "@/features/domains/dns-export";
import type { DnsRecord } from "@/features/domains/types";

const sample: DnsRecord = {
  id: "rec-1",
  domain_id: 1,
  type: "A",
  name: "@",
  content: "1.2.3.4",
  ttl: 3600,
  proxied: false,
  priority: undefined,
  created_at: "2026-01-01 00:00:00",
  updated_at: "2026-01-02 00:00:00",
};

describe("dnsRecordsToCsv", () => {
  it("exports header and escaped rows", () => {
    const csv = dnsRecordsToCsv([
      sample,
      {
        ...sample,
        id: "rec-2",
        type: "TXT",
        content: 'v=spf1, "quoted"',
        proxied: true,
        priority: 10,
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("type,name,content");
    expect(lines[1]).toContain("A,@,1.2.3.4,3600,0");
    expect(lines[2]).toContain('"v=spf1, ""quoted"""');
    expect(lines[2]).toContain(",1,10,");
  });
});
