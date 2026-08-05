import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

type GlobalStore = {
  __brutaldomainNotifyPrefs?: ServerNotifyPrefs;
};

function memoryGet(): ServerNotifyPrefs | null {
  const g = globalThis as typeof globalThis & GlobalStore;
  return g.__brutaldomainNotifyPrefs ?? null;
}

function memorySet(prefs: ServerNotifyPrefs) {
  const g = globalThis as typeof globalThis & GlobalStore;
  g.__brutaldomainNotifyPrefs = prefs;
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

/**
 * Load delivery prefs: memory → disk → env bootstrap defaults.
 * Env only fills empty defaults the first time; UI-saved prefs win.
 */
export async function readServerNotifyPrefs(): Promise<ServerNotifyPrefs> {
  const mem = memoryGet();
  if (mem) return mem;

  const disk = await readFromDisk();
  if (disk) {
    memorySet(disk);
    return disk;
  }

  const bootstrapped = normalizeServerNotifyPrefs(envBootstrap());
  memorySet(bootstrapped);
  return bootstrapped;
}

export async function writeServerNotifyPrefs(
  prefs: ServerNotifyPrefs,
): Promise<{ prefs: ServerNotifyPrefs; persistedToDisk: boolean }> {
  const normalized = normalizeServerNotifyPrefs(prefs);
  memorySet(normalized);
  const persistedToDisk = await writeToDisk(normalized);
  return { prefs: normalized, persistedToDisk };
}

export function getNotifyPrefsStorePath(): string {
  return STORE_FILE;
}
