import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let acquireAutoRenewLock: typeof import("@/lib/renew/auto-renew-lock").acquireAutoRenewLock;
let clearAutoRenewLockForTests: typeof import("@/lib/renew/auto-renew-lock").clearAutoRenewLockForTests;
let isAutoRenewLockReady: typeof import("@/lib/renew/auto-renew-lock").isAutoRenewLockReady;
let releaseAutoRenewLock: typeof import("@/lib/renew/auto-renew-lock").releaseAutoRenewLock;
let requiresAutoRenewSharedLock: typeof import("@/lib/renew/auto-renew-lock").requiresAutoRenewSharedLock;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/renew/auto-renew-lock");
  acquireAutoRenewLock = mod.acquireAutoRenewLock;
  clearAutoRenewLockForTests = mod.clearAutoRenewLockForTests;
  isAutoRenewLockReady = mod.isAutoRenewLockReady;
  releaseAutoRenewLock = mod.releaseAutoRenewLock;
  requiresAutoRenewSharedLock = mod.requiresAutoRenewSharedLock;
});

afterEach(() => {
  clearAutoRenewLockForTests();
  vi.unstubAllEnvs();
});

describe("auto renew lock", () => {
  it("uses in-memory fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");

    expect(requiresAutoRenewSharedLock()).toBe(false);
    expect(isAutoRenewLockReady()).toBe(true);
    await expect(acquireAutoRenewLock("run-a", 60_000)).resolves.toBe(true);
    await expect(acquireAutoRenewLock("run-b", 60_000)).resolves.toBe(false);
    await expect(releaseAutoRenewLock("run-b")).resolves.toBe(false);
    await expect(releaseAutoRenewLock("run-a")).resolves.toBe(true);
  });

  it("requires Blob config in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");

    expect(requiresAutoRenewSharedLock()).toBe(true);
    expect(isAutoRenewLockReady()).toBe(false);
  });

  it("treats Blob config as ready in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "token");

    expect(isAutoRenewLockReady()).toBe(true);
  });
});
