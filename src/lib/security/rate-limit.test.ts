import { afterEach, describe, expect, it, vi } from "vitest";

import { clearRateLimitBuckets, enforceRateLimit } from "@/lib/security/rate-limit";

afterEach(() => {
  clearRateLimitBuckets();
  vi.unstubAllEnvs();
});

describe("enforceRateLimit", () => {
  it("allows requests until the configured limit", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");

    const first = await enforceRateLimit({
      identifier: "alice",
      key: "whois",
      limit: 2,
      message: "too many",
      windowMs: 60_000,
    });
    const second = await enforceRateLimit({
      identifier: "alice",
      key: "whois",
      limit: 2,
      message: "too many",
      windowMs: 60_000,
    });
    const third = await enforceRateLimit({
      identifier: "alice",
      key: "whois",
      limit: 2,
      message: "too many",
      windowMs: 60_000,
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(third?.status).toBe(429);
    expect(third?.headers.get("Retry-After")).toBeTruthy();
  });

  it("isolates different buckets", async () => {
    const first = await enforceRateLimit({
      identifier: "alice",
      key: "whois",
      limit: 1,
      message: "too many",
      windowMs: 60_000,
    });
    const second = await enforceRateLimit({
      identifier: "bob",
      key: "whois",
      limit: 1,
      message: "too many",
      windowMs: 60_000,
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
  });
});
