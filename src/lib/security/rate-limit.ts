import { BlobPreconditionFailedError, get, head, put } from "@vercel/blob";

import { rateLimitExceeded } from "@/lib/api/response";

interface BucketState {
  count: number;
  resetAt: number;
}

interface RateLimitInput {
  identifier: string;
  key: string;
  limit: number;
  message: string;
  windowMs: number;
}

interface SharedRateLimitState {
  buckets: Record<string, BucketState>;
  updatedAt: string;
}

interface SharedRateLimitReadResult {
  etag: string | null;
  state: SharedRateLimitState | null;
}

const buckets = new Map<string, BucketState>();
const SHARED_RATE_LIMIT_BLOB_PATHNAME = "brutaldomain/rate-limit.json";
const MAX_SHARED_RATE_LIMIT_RETRIES = 3;

function readBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
}

function isSharedRateLimitConfigured() {
  return Boolean(readBlobToken());
}

export function clearRateLimitBuckets() {
  buckets.clear();
}

function cleanupMemoryBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function enforceInMemoryRateLimit(input: RateLimitInput) {
  const now = Date.now();
  cleanupMemoryBuckets(now);

  const bucketKey = `${input.identifier}:${input.key}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return null;
  }

  if (current.count >= input.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return rateLimitExceeded(input.message, retryAfterSeconds);
  }

  current.count += 1;
  buckets.set(bucketKey, current);
  return null;
}

function normalizeBucketState(bucket: unknown, now: number): BucketState | null {
  if (!bucket || typeof bucket !== "object") return null;

  const candidate = bucket as Partial<BucketState>;
  if (
    typeof candidate.count !== "number" ||
    !Number.isFinite(candidate.count) ||
    candidate.count < 0 ||
    !Number.isInteger(candidate.count) ||
    typeof candidate.resetAt !== "number" ||
    !Number.isFinite(candidate.resetAt)
  ) {
    return null;
  }

  if (candidate.resetAt <= now) return null;

  return {
    count: candidate.count,
    resetAt: candidate.resetAt,
  };
}

function normalizeSharedRateLimitState(
  value: unknown,
  now: number,
): SharedRateLimitState {
  const bucketsValue =
    value && typeof value === "object" && "buckets" in value
      ? (value as { buckets?: unknown }).buckets
      : undefined;

  const bucketsRecord: Record<string, BucketState> = {};
  if (bucketsValue && typeof bucketsValue === "object") {
    for (const [key, bucket] of Object.entries(bucketsValue)) {
      const normalized = normalizeBucketState(bucket, now);
      if (normalized) {
        bucketsRecord[key] = normalized;
      }
    }
  }

  return {
    buckets: bucketsRecord,
    updatedAt: new Date(now).toISOString(),
  };
}

function getBucketKey(input: RateLimitInput) {
  return `${input.identifier}:${input.key}`;
}

function createBucketState(now: number, windowMs: number): BucketState {
  return {
    count: 1,
    resetAt: now + windowMs,
  };
}

function incrementSharedState(
  state: SharedRateLimitState,
  input: RateLimitInput,
  now: number,
): { allowed: true; state: SharedRateLimitState } | { allowed: false; retryAfterSeconds: number } {
  const bucketKey = getBucketKey(input);
  const current = state.buckets[bucketKey];

  if (!current || current.resetAt <= now) {
    return {
      allowed: true,
      state: {
        buckets: {
          ...state.buckets,
          [bucketKey]: createBucketState(now, input.windowMs),
        },
        updatedAt: new Date(now).toISOString(),
      },
    };
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      ),
    };
  }

  return {
    allowed: true,
    state: {
      buckets: {
        ...state.buckets,
        [bucketKey]: {
          ...current,
          count: current.count + 1,
        },
      },
      updatedAt: new Date(now).toISOString(),
    },
  };
}

async function readSharedRateLimitState(): Promise<SharedRateLimitReadResult> {
  if (!isSharedRateLimitConfigured()) {
    return { state: null, etag: null };
  }

  try {
    const result = await get(SHARED_RATE_LIMIT_BLOB_PATHNAME, {
      access: "private",
      useCache: false,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return { state: null, etag: null };
    }

    const text = await new Response(result.stream).text();
    const now = Date.now();
    const state = text.trim()
      ? normalizeSharedRateLimitState(JSON.parse(text) as unknown, now)
      : normalizeSharedRateLimitState({}, now);

    const meta = await head(SHARED_RATE_LIMIT_BLOB_PATHNAME);
    return {
      state,
      etag: meta.etag,
    };
  } catch {
    return { state: null, etag: null };
  }
}

async function writeSharedRateLimitState(
  state: SharedRateLimitState,
  etag: string | null,
): Promise<{ persisted: boolean; preconditionFailed: boolean }> {
  if (!isSharedRateLimitConfigured()) {
    return { persisted: false, preconditionFailed: false };
  }

  try {
    await put(
      SHARED_RATE_LIMIT_BLOB_PATHNAME,
      JSON.stringify(state, null, 2),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        token: readBlobToken(),
        ...(etag ? { ifMatch: etag } : {}),
      },
    );

    return { persisted: true, preconditionFailed: false };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      return { persisted: false, preconditionFailed: true };
    }

    return { persisted: false, preconditionFailed: false };
  }
}

async function enforceSharedRateLimit(input: RateLimitInput) {
  const now = Date.now();

  for (let attempt = 0; attempt < MAX_SHARED_RATE_LIMIT_RETRIES; attempt += 1) {
    const snapshot = await readSharedRateLimitState();
    const state = snapshot.state ?? normalizeSharedRateLimitState({}, now);
    const result = incrementSharedState(state, input, now);

    if (!result.allowed) {
      return rateLimitExceeded(input.message, result.retryAfterSeconds);
    }

    const saved = await writeSharedRateLimitState(result.state, snapshot.etag);
    if (saved.preconditionFailed) {
      continue;
    }

    if (saved.persisted) {
      return null;
    }

    break;
  }

  return enforceInMemoryRateLimit(input);
}

export async function enforceRateLimit(input: RateLimitInput) {
  if (!isSharedRateLimitConfigured()) {
    return enforceInMemoryRateLimit(input);
  }

  return enforceSharedRateLimit(input);
}
