import { describe, expect, it } from "vitest";

import {
  canRenewByRemainingDays,
  isWithinAutoRenewWindow,
  normalizeAutomationPrefs,
  validateAutomationPrefs,
} from "@/features/settings/automation-prefs";

describe("automation prefs", () => {
  it("normalizes invalid days and caps renew window at 180", () => {
    const prefs = normalizeAutomationPrefs({
      notifyDays: 99 as never,
      autoRenewDays: 5 as never,
      ...( { autoRenewYears: 3 } as object ),
    } as Partial<import("@/features/settings/automation-prefs").AutomationPrefs>);
    expect(prefs.notifyDays).toBe(30);
    expect(prefs.autoRenewDays).toBe(180);
    expect(
      "autoRenewYears" in (prefs as unknown as Record<string, unknown>),
    ).toBe(false);
  });

  it("accepts 180-day renew window", () => {
    const prefs = normalizeAutomationPrefs({ autoRenewDays: 180 });
    expect(prefs.autoRenewDays).toBe(180);
  });

  it("requires email when channel enabled", () => {
    const errors = validateAutomationPrefs(
      normalizeAutomationPrefs({
        channelEmail: true,
        email: "bad",
        channelInApp: true,
      }),
    );
    expect(errors[0]).toContain("邮箱");
  });

  it("requires at least one channel when notify on", () => {
    const errors = validateAutomationPrefs(
      normalizeAutomationPrefs({
        notifyEnabled: true,
        channelInApp: false,
        channelBrowser: false,
        channelEmail: false,
        channelTelegram: false,
      }),
    );
    expect(errors[0]).toContain("渠道");
  });

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
