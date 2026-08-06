import { describe, expect, it } from "vitest";

import type { Subdomain } from "@/features/domains/types";
import {
  decideAutoRenew,
  selectAutoRenewCandidates,
} from "@/lib/renew/auto-renew-policy";

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

describe("auto-renew policy", () => {
  const prefs = {
    autoRenewDays: 180 as const,
    autoRenewRegisteredOnly: true,
  };
  const now = new Date("2026-08-05T00:00:00.000Z");

  it("accepts only active domains within the configured window", () => {
    expect(
      decideAutoRenew(
        domain({
          id: 1,
          full_domain: "ok.example.com",
          expires_at: "2026-08-06 00:00:00",
        }),
        prefs,
        now,
      ).eligible,
    ).toBe(true);
    expect(
      decideAutoRenew(
        domain({
          id: 2,
          full_domain: "expired.example.com",
          expires_at: "2026-07-01 00:00:00",
        }),
        { ...prefs, autoRenewRegisteredOnly: false },
        now,
      ).eligible,
    ).toBe(true);
    expect(
      decideAutoRenew(
        domain({
          id: 3,
          full_domain: "pending.example.com",
          expires_at: "2026-08-06 00:00:00",
          status: "Pending",
        }),
        prefs,
        now,
      ),
    ).toMatchObject({ eligible: false, reason: "status_not_registered" });
    expect(
      decideAutoRenew(
        domain({
          id: 4,
          full_domain: "far.example.com",
          expires_at: "2027-03-01 00:00:00",
        }),
        prefs,
        now,
      ),
    ).toMatchObject({ eligible: false, reason: "outside_window" });
  });

  it("orders candidates by nearest expiry and caps the result size", () => {
    const candidates = selectAutoRenewCandidates(
      [
        domain({ id: 1, full_domain: "b.example.com", expires_at: "2026-08-10 00:00:00" }),
        domain({ id: 2, full_domain: "a.example.com", expires_at: "2026-08-06 00:00:00" }),
        domain({ id: 3, full_domain: "c.example.com", expires_at: "2026-08-15 00:00:00" }),
      ],
      prefs,
      { now, limit: 2 },
    );
    expect(candidates.map((item) => item.domain.full_domain)).toEqual([
      "a.example.com",
      "b.example.com",
    ]);
  });
});
