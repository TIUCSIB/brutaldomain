import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let getProductionAutoRenewConfigIssues: typeof import("@/lib/env/server-env").getProductionAutoRenewConfigIssues;

beforeEach(async () => {
  vi.resetModules();
  ({ getProductionAutoRenewConfigIssues } = await import("@/lib/env/server-env"));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getProductionAutoRenewConfigIssues", () => {
  it("returns no issues outside production", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(getProductionAutoRenewConfigIssues()).toEqual([]);
  });

  it("reports missing production config", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("GITHUB_ALLOWED_USERS", "");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("DNSHE_API_KEY", "");
    vi.stubEnv("DNSHE_API_SECRET", "");

    expect(getProductionAutoRenewConfigIssues()).toEqual([
      "GitHub OAuth / GITHUB_ALLOWED_USERS is not configured",
      "CRON_SECRET is not configured",
      "BLOB_READ_WRITE_TOKEN is not configured",
      "DNSHE_API_KEY / DNSHE_API_SECRET are not configured",
    ]);
  });
});
