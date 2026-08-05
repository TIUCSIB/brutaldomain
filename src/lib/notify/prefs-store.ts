import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

import {
  normalizeServerNotifyPrefs,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import {
  readDefaultNotifyEmail,
  readDefaultTelegramChatId,
} from "@/lib/env/notify-env";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "notify-prefs.json");
/** Private blob pathname for durable prefs on Vercel. */
export const NOTIFY_PREFS_BLOB_PATHNAME = "brutaldomain/notify-prefs.json";

export type NotifyPrefsBackend = "blob" | "disk" | "memory";

type GlobalStore = {
  __brutaldomainNotifyPrefs?: ServerNotifyPrefs;
  __brutaldomainNotifyPrefsBackend?: NotifyPrefsBackend;
};

function memoryGet(): ServerNotifyPrefs | null {
  const g = globalThis as typeof globalThis & GlobalStore;
  return g.__brutaldomainNotifyPrefs ?? null;
}

function memorySet(prefs: ServerNotifyPrefs, backend?: NotifyPrefsBackend) {
  const g = globalThis as typeof globalThis & GlobalStore;
  g.__brutaldomainNotifyPrefs = prefs;
  if (backend) g.__brutaldomainNotifyPrefsBackend = backend;
}

function memoryBackend(): NotifyPrefsBackend | null {
  const g = globalThis as typeof globalThis & GlobalStore;
  return g.__brutaldomainNotifyPrefsBackend ?? null;
}

export function isBlobPrefsConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function envBootstrap(): Partial<ServerNotifyPrefs> {
  const email = readDefaultNotifyEmail() ?? "";
  const telegramChatId = readDefaultTelegramChatId() ?? "";
  const windowRaw = process.env.NOTIFY_WINDOW_DAYS?.trim();
  const windowDays = windowRaw ? Number(windowRaw) : NaN;
  return {
    email,
    telegramChatId,
    channelEmail: Boolean(email),
    channelTelegram: Boolean(telegramChatId),
    notifyDays: Number.isFinite(windowDays)
      ? (windowDays as ServerNotifyPrefs["notifyDays"])
      : undefined,
  };
}

async function readFromDisk(): Promise<ServerNotifyPrefs | null> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    return normalizeServerNotifyPrefs(
      JSON.parse(raw) as Partial<ServerNotifyPrefs>,
    );
  } catch {
    return null;
  }
}

async function writeToDisk(prefs: ServerNotifyPrefs): Promise<boolean> {
  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(STORE_FILE, `${JSON.stringify(prefs, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function readFromBlob(): Promise<ServerNotifyPrefs | null> {
  if (!isBlobPrefsConfigured()) return null;
  try {
    const result = await get(NOTIFY_PREFS_BLOB_PATHNAME, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const text = await new Response(result.stream).text();
    if (!text.trim()) return null;
    return normalizeServerNotifyPrefs(
      JSON.parse(text) as Partial<ServerNotifyPrefs>,
    );
  } catch {
    return null;
  }
}

async function writeToBlob(prefs: ServerNotifyPrefs): Promise<boolean> {
  if (!isBlobPrefsConfigured()) return false;
  try {
    await put(NOTIFY_PREFS_BLOB_PATHNAME, JSON.stringify(prefs, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load delivery prefs priority:
 * memory → Vercel Blob (if token) → local disk → env bootstrap.
 */
export async function readServerNotifyPrefs(): Promise<ServerNotifyPrefs> {
  const mem = memoryGet();
  if (mem) return mem;

  if (isBlobPrefsConfigured()) {
    const fromBlob = await readFromBlob();
    if (fromBlob) {
      memorySet(fromBlob, "blob");
      return fromBlob;
    }
  }

  const disk = await readFromDisk();
  if (disk) {
    memorySet(disk, "disk");
    return disk;
  }

  const bootstrapped = normalizeServerNotifyPrefs(envBootstrap());
  memorySet(bootstrapped, isBlobPrefsConfigured() ? "blob" : "memory");
  return bootstrapped;
}

export async function writeServerNotifyPrefs(
  prefs: ServerNotifyPrefs,
): Promise<{
  prefs: ServerNotifyPrefs;
  backend: NotifyPrefsBackend;
  persisted: boolean;
  persistedToDisk: boolean;
  persistedToBlob: boolean;
}> {
  const normalized = normalizeServerNotifyPrefs(prefs);

  let persistedToBlob = false;
  let persistedToDisk = false;
  let backend: NotifyPrefsBackend = "memory";

  if (isBlobPrefsConfigured()) {
    persistedToBlob = await writeToBlob(normalized);
    if (persistedToBlob) backend = "blob";
  }

  // Always try local disk in dev / long-running Node for easier inspection.
  persistedToDisk = await writeToDisk(normalized);
  if (!persistedToBlob && persistedToDisk) backend = "disk";

  memorySet(normalized, backend);

  return {
    prefs: normalized,
    backend,
    persisted: persistedToBlob || persistedToDisk,
    persistedToDisk,
    persistedToBlob,
  };
}

export function getNotifyPrefsStorePath(): string {
  return isBlobPrefsConfigured()
    ? `blob://${NOTIFY_PREFS_BLOB_PATHNAME}`
    : STORE_FILE;
}

export function getNotifyPrefsBackendHint(): NotifyPrefsBackend {
  if (memoryBackend()) return memoryBackend()!;
  if (isBlobPrefsConfigured()) return "blob";
  return "disk";
}
