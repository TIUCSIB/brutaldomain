import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, get, head, put } from "@vercel/blob";

import {
  normalizeServerRenewPrefs,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import {
  readDefaultNotifyEmail,
  readDefaultTelegramChatId,
} from "@/lib/env/notify-env";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "auto-renew-state.json");
export const AUTO_RENEW_STATE_BLOB_PATHNAME = "brutaldomain/auto-renew-state.json";
export const AUTO_RENEW_HISTORY_LIMIT = 100;
export const AUTO_RENEW_LEASE_MS = 15 * 60 * 1000;

export type RenewStateBackend = "blob" | "disk" | "memory";
export type RenewOutcome = "succeeded" | "failed" | "unknown" | "skipped";

export interface RenewHistoryEntry {
  key: string;
  domainId: number;
  fullDomain: string;
  previousExpiresAt: string;
  windowDays: number;
  outcome: RenewOutcome;
  createdAt: string;
  source: "cron" | "preview";
  renewedAt?: string;
  newExpiresAt?: string;
  chargedAmount?: string | number;
  errorCode?: string;
  errorMessage?: string;
}

export interface RenewRunState {
  prefs: ServerRenewPrefs;
  lease: { runId: string; expiresAt: string } | null;
  history: RenewHistoryEntry[];
}

interface ReadRenewStateOptions {
  blobOnly?: boolean;
  fresh?: boolean;
}

interface WriteRenewStateOptions {
  ifMatch?: string | null;
  requireBlob?: boolean;
}

interface BlobStateReadResult {
  etag: string | null;
  state: RenewRunState | null;
}

export interface RenewStateSnapshot {
  backend: RenewStateBackend;
  etag: string | null;
  state: RenewRunState;
}

interface BlobWriteResult {
  persisted: boolean;
  preconditionFailed: boolean;
}

interface GlobalStore {
  __brutaldomainRenewState?: RenewRunState;
  __brutaldomainRenewStateBackend?: RenewStateBackend;
}

function memoryGet(): RenewRunState | null {
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  return globalStore.__brutaldomainRenewState ?? null;
}

function memorySet(state: RenewRunState, backend?: RenewStateBackend): void {
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  globalStore.__brutaldomainRenewState = state;
  if (backend) globalStore.__brutaldomainRenewStateBackend = backend;
}

function memoryBackend(): RenewStateBackend | null {
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  return globalStore.__brutaldomainRenewStateBackend ?? null;
}

export function clearRenewStateMemoryCache() {
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  delete globalStore.__brutaldomainRenewState;
  delete globalStore.__brutaldomainRenewStateBackend;
}

export function isRenewBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function requiresDurableRenewStorage(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDurableRenewStorageReady(): boolean {
  return !requiresDurableRenewStorage() || isRenewBlobConfigured();
}

function emptyState(): RenewRunState {
  return {
    prefs: normalizeServerRenewPrefs({
      email: readDefaultNotifyEmail() ?? "",
      telegramChatId: readDefaultTelegramChatId() ?? "",
      channelEmail: Boolean(readDefaultNotifyEmail()),
      channelTelegram: Boolean(readDefaultTelegramChatId()),
    }),
    lease: null,
    history: [],
  };
}

function normalizeHistory(value: unknown): RenewHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is RenewHistoryEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<RenewHistoryEntry>;
      return (
        typeof candidate.key === "string" &&
        typeof candidate.domainId === "number" &&
        typeof candidate.fullDomain === "string" &&
        typeof candidate.previousExpiresAt === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.windowDays === "number" &&
        (candidate.outcome === "succeeded" ||
          candidate.outcome === "failed" ||
          candidate.outcome === "unknown" ||
          candidate.outcome === "skipped")
      );
    })
    .slice(-AUTO_RENEW_HISTORY_LIMIT);
}

function normalizeState(
  value: Partial<RenewRunState> | null | undefined,
): RenewRunState {
  const base = value ?? {};
  const lease = base.lease;
  return {
    prefs: normalizeServerRenewPrefs(base.prefs),
    lease:
      lease &&
      typeof lease.runId === "string" &&
      typeof lease.expiresAt === "string"
        ? lease
        : null,
    history: normalizeHistory(base.history),
  };
}

async function readDisk(): Promise<RenewRunState | null> {
  try {
    return normalizeState(
      JSON.parse(await readFile(STORE_FILE, "utf8")) as Partial<RenewRunState>,
    );
  } catch {
    return null;
  }
}

async function writeDisk(state: RenewRunState): Promise<boolean> {
  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(STORE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function readBlob(options: { fresh?: boolean } = {}): Promise<BlobStateReadResult> {
  if (!isRenewBlobConfigured()) {
    return { state: null, etag: null };
  }

  try {
    const result = await get(AUTO_RENEW_STATE_BLOB_PATHNAME, {
      access: "private",
      useCache: options.fresh ? false : true,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { state: null, etag: null };
    }

    const meta = await head(AUTO_RENEW_STATE_BLOB_PATHNAME);
    const text = await new Response(result.stream).text();
    return {
      etag: meta.etag,
      state: text.trim()
        ? normalizeState(JSON.parse(text) as Partial<RenewRunState>)
        : emptyState(),
    };
  } catch {
    return { state: null, etag: null };
  }
}

async function writeBlob(
  state: RenewRunState,
  options: { ifMatch?: string | null } = {},
): Promise<BlobWriteResult> {
  if (!isRenewBlobConfigured()) {
    return { persisted: false, preconditionFailed: false };
  }

  try {
    await put(AUTO_RENEW_STATE_BLOB_PATHNAME, JSON.stringify(state, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ...(options.ifMatch ? { ifMatch: options.ifMatch } : {}),
    });
    return { persisted: true, preconditionFailed: false };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      return { persisted: false, preconditionFailed: true };
    }
    return { persisted: false, preconditionFailed: false };
  }
}

export async function readRenewStateSnapshot(
  options: ReadRenewStateOptions = {},
): Promise<RenewStateSnapshot> {
  if (!options.fresh) {
    const memory = memoryGet();
    if (memory) {
      return {
        state: memory,
        backend: memoryBackend() ?? "memory",
        etag: null,
      };
    }
  }

  if (options.blobOnly) {
    const blob = await readBlob({ fresh: options.fresh });
    const state = blob.state ?? emptyState();
    memorySet(state, isRenewBlobConfigured() ? "blob" : "memory");
    return {
      state,
      etag: blob.etag,
      backend: isRenewBlobConfigured() ? "blob" : "memory",
    };
  }

  const blob = await readBlob({ fresh: options.fresh });
  if (blob.state) {
    memorySet(blob.state, "blob");
    return {
      state: blob.state,
      etag: blob.etag,
      backend: "blob",
    };
  }

  const disk = await readDisk();
  if (disk) {
    memorySet(disk, "disk");
    return {
      state: disk,
      etag: null,
      backend: "disk",
    };
  }

  const state = emptyState();
  memorySet(state, isRenewBlobConfigured() ? "blob" : "memory");
  return {
    state,
    etag: null,
    backend: isRenewBlobConfigured() ? "blob" : "memory",
  };
}

export async function readRenewState(
  options: ReadRenewStateOptions = {},
): Promise<RenewRunState> {
  return (await readRenewStateSnapshot(options)).state;
}

export async function writeRenewState(
  state: RenewRunState,
  options: WriteRenewStateOptions = {},
): Promise<{
  state: RenewRunState;
  backend: RenewStateBackend;
  persisted: boolean;
  persistedToBlob: boolean;
  persistedToDisk: boolean;
  preconditionFailed: boolean;
}> {
  const normalized = normalizeState(state);
  const blobResult = await writeBlob(normalized, { ifMatch: options.ifMatch });
  const persistedToBlob = blobResult.persisted;
  const persistedToDisk =
    options.requireBlob || persistedToBlob ? false : await writeDisk(normalized);
  const backend: RenewStateBackend = persistedToBlob
    ? "blob"
    : persistedToDisk
      ? "disk"
      : "memory";
  const persisted = options.requireBlob
    ? persistedToBlob
    : persistedToBlob || persistedToDisk;

  if (persisted || !options.requireBlob) {
    memorySet(normalized, backend);
  }

  return {
    state: normalized,
    backend,
    persisted,
    persistedToBlob,
    persistedToDisk,
    preconditionFailed: blobResult.preconditionFailed,
  };
}

export function getRenewStateBackend(): RenewStateBackend {
  return memoryBackend() ?? (isRenewBlobConfigured() ? "blob" : "disk");
}

export function getRenewStateStorePath(): string {
  return isRenewBlobConfigured()
    ? `blob://${AUTO_RENEW_STATE_BLOB_PATHNAME}`
    : STORE_FILE;
}

export function renewHistoryKey(domainId: number, previousExpiresAt: string): string {
  return `${domainId}:${previousExpiresAt}`;
}

export function mergeRenewHistory(
  ...lists: RenewHistoryEntry[][]
): RenewHistoryEntry[] {
  const combined = lists.flat();
  const deduped: RenewHistoryEntry[] = [];
  const seen = new Set<string>();

  for (let index = combined.length - 1; index >= 0; index -= 1) {
    const item = combined[index];
    if (!item || seen.has(item.key)) continue;
    seen.add(item.key);
    deduped.push(item);
  }

  return deduped.reverse().slice(-AUTO_RENEW_HISTORY_LIMIT);
}

export function isRenewLeaseActive(state: RenewRunState, now = new Date()): boolean {
  if (!state.lease) return false;
  const expiresAt = Date.parse(state.lease.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}
