import { describe, expect, it } from "vitest";

import { getExpiryAlerts } from "./expiry-alerts";
import type { Subdomain } from "./types";

function domain(
  partial: Partial<Subdomain> & Pick<Subdomain, "id" | "expires_at">,
): Subdomain {
  const id = partial.id;
  return {
    subdomain: "app",
    rootdomain: "example.com",
    full_domain: `d${id}.example.com`,
    status: "Registered",
    created_at: "2024-01-01 00:00:00",
    updated_at: "2024-01-01 00:00:00",
    never_expires: 0,
    cloudflare_zone_id: null,
    provider_account_id: 1,
    ...partial,
  };
}

describe("getExpiryAlerts", () => {
  const now = new Date("2026-08-04T00:00:00.000Z");

  it("includes expired and within-window domains", () => {
    const alerts = getExpiryAlerts(
      [
        domain({
          id: 1,
          expires_at: "2026-07-01 00:00:00",
          full_domain: "expired.example.com",
        }),
        domain({
          id: 2,
          expires_at: "2026-08-10 00:00:00",
          full_domain: "soon.example.com",
        }),
        domain({
          id: 3,
          expires_at: "2027-01-01 00:00:00",
          full_domain: "safe.example.com",
        }),
        domain({
          id: 4,
          expires_at: "2099-01-01 00:00:00",
          never_expires: 1,
          full_domain: "never.example.com",
        }),
      ],
      { now, windowDays: 30 },
    );

    expect(alerts.map((item) => item.domain.id)).toEqual([1, 2]);
    expect(alerts[0]?.level).toBe("expired");
    expect(alerts[1]?.level).toBe("critical");
  });

  it("skips dismissed alerts for the same expiry", () => {
    const alerts = getExpiryAlerts(
      [
        domain({
          id: 9,
          expires_at: "2026-08-20 00:00:00",
        }),
      ],
      {
        now,
        windowDays: 30,
        dismissed: { "9": "2026-08-20 00:00:00" },
      },
    );
    expect(alerts).toHaveLength(0);
  });
});
