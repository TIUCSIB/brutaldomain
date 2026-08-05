import { describe, expect, it } from "vitest";

import type { Subdomain } from "@/features/domains/types";
import {
  formatExpiryNotifyText,
  scanExpiryNotifyItems,
} from "@/lib/notify/expiry-scan";

function domain(
  partial: Partial<Subdomain> &
    Pick<Subdomain, "id" | "full_domain" | "expires_at">,
): Subdomain {
  return {
    subdomain: "app",
    rootdomain: "example.com",
    status: "Registered",
    never_expires: 0,
    created_at: "2024-01-01 00:00:00",
    updated_at: "2024-01-01 00:00:00",
    cloudflare_zone_id: null,
    provider_account_id: 1,
    ...partial,
  };
}

describe("expiry-scan", () => {
  const now = new Date("2026-08-05T00:00:00.000Z");

  it("filters by window and includeExpired", () => {
    const domains = [
      domain({
        id: 1,
        full_domain: "soon.example.com",
        expires_at: "2026-08-10 00:00:00",
      }),
      domain({
        id: 2,
        full_domain: "later.example.com",
        expires_at: "2026-12-01 00:00:00",
      }),
      domain({
        id: 3,
        full_domain: "old.example.com",
        expires_at: "2026-07-01 00:00:00",
      }),
    ];

    const withExpired = scanExpiryNotifyItems(domains, {
      windowDays: 30,
      includeExpired: true,
      now,
    });
    expect(withExpired.map((item) => item.fullDomain)).toEqual([
      "old.example.com",
      "soon.example.com",
    ]);

    const withoutExpired = scanExpiryNotifyItems(domains, {
      windowDays: 30,
      includeExpired: false,
      now,
    });
    expect(withoutExpired.map((item) => item.fullDomain)).toEqual([
      "soon.example.com",
    ]);
  });

  it("formats empty and non-empty messages", () => {
    expect(
      formatExpiryNotifyText({ items: [], windowDays: 14 }),
    ).toContain("没有需要提醒");

    const text = formatExpiryNotifyText({
      windowDays: 14,
      items: [
        {
          id: 1,
          fullDomain: "a.example.com",
          status: "Registered",
          expiresAt: "2026-08-06 00:00:00",
          remainingDays: 1,
          level: "critical",
        },
      ],
    });
    expect(text).toContain("a.example.com");
    expect(text).toContain("剩余 1 天");
  });
});
