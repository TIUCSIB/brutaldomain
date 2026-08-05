import { describe, expect, it } from "vitest";

import {
  normalizeAutomationPrefs,
  validateAutomationPrefs,
} from "@/features/settings/automation-prefs";

describe("automation prefs", () => {
  it("normalizes invalid days", () => {
    const prefs = normalizeAutomationPrefs({
      notifyDays: 99 as never,
      autoRenewDays: 5 as never,
    });
    expect(prefs.notifyDays).toBe(30);
    expect(prefs.autoRenewDays).toBe(7);
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
});
