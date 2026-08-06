import { describe, expect, it } from "vitest";

import {
  getNextAutoRenewRunAt,
  isAutoRenewDue,
  normalizeServerRenewPrefs,
  validateRenewNotificationTargets,
  validateServerRenewPrefs,
} from "./server-renew-prefs";

describe("server renew prefs", () => {
  const now = new Date("2026-08-05T00:00:00.000Z");

  it("requires explicit consent when auto renew is enabled", () => {
    const prefs = normalizeServerRenewPrefs({
      autoRenewEnabled: true,
      consentAt: null,
    });
    expect(validateServerRenewPrefs(prefs)[0]).toContain("确认");
  });

  it("normalizes success notification fields", () => {
    const prefs = normalizeServerRenewPrefs({
      notifyOnSuccess: true,
      channelEmail: true,
      email: " user@example.com ",
      channelTelegram: true,
      telegramChatId: " 123456 ",
      telegramHint: " bot ",
    });
    expect(prefs.notifyOnSuccess).toBe(true);
    expect(prefs.channelEmail).toBe(true);
    expect(prefs.email).toBe("user@example.com");
    expect(prefs.channelTelegram).toBe(true);
    expect(prefs.telegramChatId).toBe("123456");
    expect(prefs.telegramHint).toBe("bot");
  });

  it("validates remote channels only when success notifications are enabled", () => {
    const disabledNotify = validateServerRenewPrefs(
      normalizeServerRenewPrefs({
        notifyOnSuccess: false,
        channelEmail: true,
        email: "bad",
      }),
    );
    expect(disabledNotify).toEqual([]);

    const missingChannel = validateServerRenewPrefs(
      normalizeServerRenewPrefs({
        notifyOnSuccess: true,
        channelEmail: false,
        channelTelegram: false,
      }),
    );
    expect(missingChannel[0]).toContain("至少启用一种测试通知渠道");

    const invalidEmail = validateServerRenewPrefs(
      normalizeServerRenewPrefs({
        notifyOnSuccess: true,
        channelEmail: true,
        email: "bad",
      }),
    );
    expect(invalidEmail[0]).toContain("邮箱");

    const missingTelegram = validateServerRenewPrefs(
      normalizeServerRenewPrefs({
        notifyOnSuccess: true,
        channelTelegram: true,
        telegramChatId: "",
      }),
    );
    expect(missingTelegram[0]).toContain("Chat ID");
  });

  it("validates test notification targets without requiring auto-renew consent", () => {
    const missingChannel = validateRenewNotificationTargets(
      normalizeServerRenewPrefs({
        autoRenewEnabled: false,
        notifyOnSuccess: false,
        channelEmail: false,
        channelTelegram: false,
      }),
    );
    expect(missingChannel[0]).toContain("测试通知渠道");

    const validTargets = validateRenewNotificationTargets(
      normalizeServerRenewPrefs({
        channelEmail: true,
        email: "user@example.com",
      }),
    );
    expect(validTargets).toEqual([]);
  });

  it("tracks a ten-day server cadence", () => {
    expect(isAutoRenewDue(null, now)).toBe(true);
    expect(isAutoRenewDue("2026-07-27T00:00:00.000Z", now)).toBe(false);
    expect(isAutoRenewDue("2026-07-26T00:00:00.000Z", now)).toBe(true);
    expect(
      getNextAutoRenewRunAt("2026-07-26T00:00:00.000Z")?.toISOString(),
    ).toBe("2026-08-05T00:00:00.000Z");
  });
});
