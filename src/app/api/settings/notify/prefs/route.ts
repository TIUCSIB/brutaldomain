import { NextResponse } from "next/server";

import {
  normalizeServerNotifyPrefs,
  validateServerNotifyPrefs,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import { getSession } from "@/lib/auth/session";
import { getNotifyEnvStatus } from "@/lib/env/notify-env";
import {
  getNotifyPrefsBackendHint,
  getNotifyPrefsStorePath,
  isBlobPrefsConfigured,
  readServerNotifyPrefs,
  writeServerNotifyPrefs,
} from "@/lib/notify/prefs-store";

export const dynamic = "force-dynamic";

function storageMeta() {
  return {
    backend: getNotifyPrefsBackendHint(),
    blobConfigured: isBlobPrefsConfigured(),
    storePath: getNotifyPrefsStorePath(),
  };
}

export async function GET() {
  const prefs = await readServerNotifyPrefs();
  return NextResponse.json({
    prefs,
    secrets: getNotifyEnvStatus(),
    storage: storageMeta(),
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  let body: Partial<ServerNotifyPrefs> = {};
  try {
    body = (await request.json()) as Partial<ServerNotifyPrefs>;
  } catch {
    return NextResponse.json({ message: "无效的 JSON" }, { status: 400 });
  }

  const next = normalizeServerNotifyPrefs({
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session?.username ?? "unknown",
  });

  const errors = validateServerNotifyPrefs(next);
  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0], errors }, { status: 400 });
  }

  const result = await writeServerNotifyPrefs(next);

  let warning: string | null = null;
  if (result.persistedToBlob) {
    warning = null;
  } else if (result.persistedToDisk) {
    warning = isBlobPrefsConfigured()
      ? "Blob 写入失败，已回退到本地 .data/（仅当前机器有效）。"
      : "已写入本地 .data/。部署到 Vercel 请配置 BLOB_READ_WRITE_TOKEN。";
  } else {
    warning =
      "未能持久化（Blob/磁盘均失败），仅保存在当前进程内存，重启后可能丢失。";
  }

  return NextResponse.json({
    prefs: result.prefs,
    persisted: result.persisted,
    persistedToDisk: result.persistedToDisk,
    persistedToBlob: result.persistedToBlob,
    backend: result.backend,
    secrets: getNotifyEnvStatus(),
    storage: storageMeta(),
    warning,
  });
}
