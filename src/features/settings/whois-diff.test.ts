import { describe, expect, it } from "vitest";

import { diffWhois } from "@/features/settings/whois-diff";

describe("diffWhois", () => {
  it("returns empty without previous", () => {
    expect(
      diffWhois(null, {
        domain: "a.com",
        registered: true,
        status: "ok",
      }),
    ).toEqual([]);
  });

  it("detects field changes", () => {
    const lines = diffWhois(
      {
        domain: "a.com",
        registered: true,
        status: "active",
        expires_at: "2026-01-01",
        nameservers: ["ns1.a.com"],
        queriedAt: 1,
      },
      {
        domain: "a.com",
        registered: true,
        status: "clientTransferProhibited",
        expires_at: "2027-01-01",
        nameservers: ["ns2.a.com"],
      },
    );
    expect(lines.map((line) => line.field)).toEqual(
      expect.arrayContaining(["状态", "到期时间", "名称服务器"]),
    );
  });
});
