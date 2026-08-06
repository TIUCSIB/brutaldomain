import {
  clearRenewStateMemoryCache,
  isRenewBlobConfigured,
  isRenewLeaseActive,
  readRenewStateSnapshot,
  writeRenewState,
} from "@/lib/renew/renew-state-store";

interface MemoryLockState {
  expiresAt: number;
  token: string;
}

let memoryLock: MemoryLockState | null = null;

export function requiresAutoRenewSharedLock() {
  return process.env.NODE_ENV === "production";
}

export function isAutoRenewLockConfigured() {
  return isRenewBlobConfigured();
}

export function isAutoRenewLockReady() {
  return !requiresAutoRenewSharedLock() || isAutoRenewLockConfigured();
}

function shouldRequireBlobLock() {
  return requiresAutoRenewSharedLock();
}

function now() {
  return Date.now();
}

export async function acquireAutoRenewLock(token: string, ttlMs: number) {
  const requireBlob = shouldRequireBlobLock();
  if (!requireBlob) {
    const current = memoryLock;
    if (current && current.expiresAt > now()) {
      return false;
    }

    memoryLock = {
      token,
      expiresAt: now() + ttlMs,
    };
    return true;
  }

  const snapshot = await readRenewStateSnapshot({ fresh: true, blobOnly: true });
  if (isRenewLeaseActive(snapshot.state)) {
    return false;
  }

  const saved = await writeRenewState(
    {
      ...snapshot.state,
      lease: {
        runId: token,
        expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      },
    },
    {
      requireBlob: true,
      ifMatch: snapshot.etag,
    },
  );

  if (!saved.persisted || saved.preconditionFailed) {
    return false;
  }

  const latest = await readRenewStateSnapshot({ fresh: true, blobOnly: true });
  return latest.state.lease?.runId === token;
}

export async function releaseAutoRenewLock(token: string) {
  const requireBlob = shouldRequireBlobLock();
  if (!requireBlob) {
    if (!memoryLock || memoryLock.token !== token) {
      return false;
    }

    memoryLock = null;
    return true;
  }

  const snapshot = await readRenewStateSnapshot({ fresh: true, blobOnly: true });
  if (snapshot.state.lease?.runId !== token) {
    return false;
  }

  const saved = await writeRenewState(
    {
      ...snapshot.state,
      lease: null,
    },
    {
      requireBlob: true,
      ifMatch: snapshot.etag,
    },
  );

  return saved.persisted && !saved.preconditionFailed;
}

export function clearAutoRenewLockForTests() {
  memoryLock = null;
  clearRenewStateMemoryCache();
}
