import { describe, expect, it } from "vitest";

import { buildWeekTodos } from "@/components/dashboard-week-todo";
import type { Subdomain } from "@/features/domains/types";

function domain(partial: Partial<Subdomain> & Pick<Subdomain, "id" | "full_domain">): Subdomain {
  return {
    subdomain: "",
    rootdomain: "example.com",
    status: "Registered",
    created_at: "2026-01-01 00:00:00",
    updated_at: "2026-01-01 00:00:00",
    expires_at: "2026-12-31 00:00:00",
    never_expires: 0,
    cloudflare_zone_id: null,
    provider_account_id: 1,
    ...partial,
  };
}

describe("buildWeekTodos", () => {
  const now = new Date("2026-08-04T00:00:00Z");

  it("prioritizes expired then error then week", () => {
    const items = buildWeekTodos(
      [
        domain({
          id: 1,
          full_domain: "week.example.com",
          expires_at: "2026-08-08 00:00:00",
        }),
        domain({
          id: 2,
          full_domain: "err.example.com",
          status: "Error",
          expires_at: "2027-01-01 00:00:00",
        }),
        domain({
          id: 3,
          full_domain: "old.example.com",
          expires_at: "2026-07-01 00:00:00",
        }),
        domain({
          id: 4,
          full_domain: "ok.example.com",
          expires_at: "2027-08-01 00:00:00",
        }),
      ],
      now,
    );

    expect(items.map((item) => item.domain.id)).toEqual([3, 2, 1]);
    expect(items[0].kind).toBe("expired");
    expect(items[1].kind).toBe("error");
    expect(items[2].kind).toBe("week");
  });
});
