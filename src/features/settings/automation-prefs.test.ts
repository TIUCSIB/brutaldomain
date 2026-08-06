import { describe, expect, it } from "vitest";

import {
  canRenewByRemainingDays,
  isWithinAutoRenewWindow,
} from "@/features/settings/automation-prefs";

describe("automation prefs", () => {
  it("renew eligibility is remaining ≤ 180 days", () => {
    expect(canRenewByRemainingDays(null)).toBe(false);
    expect(canRenewByRemainingDays(181)).toBe(false);
    expect(canRenewByRemainingDays(180)).toBe(true);
    expect(canRenewByRemainingDays(0)).toBe(true);
    expect(canRenewByRemainingDays(-3)).toBe(true);
  });

  it("auto-renew window excludes expired and over-cap", () => {
    expect(isWithinAutoRenewWindow(30, 180)).toBe(true);
    expect(isWithinAutoRenewWindow(-1, 180)).toBe(false);
    expect(isWithinAutoRenewWindow(200, 180)).toBe(false);
  });
});
