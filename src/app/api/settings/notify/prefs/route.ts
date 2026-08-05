import { NextResponse } from "next/server";

import {
  normalizeServerNotifyPrefs,
  validateServerNotifyPrefs,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import { getSession } from "@/lib/auth/session";
import { getNotifyEnvStatus } from "@/lib/env/notify-env";
import {
  getNotifyPrefsStorePath,
  readServerNotifyPrefs,
  writeServerNotifyPrefs,
} from "@/lib/notify/prefs-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const prefs = await readServerNotifyPrefs();
  return NextResponse.json({
    prefs,
    secrets: getNotifyEnvStatus(),
    storePath: getNotifyPrefsStorePath(),
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

  const { prefs, persistedToDisk } = await writeServerNotifyPrefs(next);
  return NextResponse.json({
    prefs,
    persistedToDisk,
    secrets: getNotifyEnvStatus(),
    warning: persistedToDisk
      ? null
      : "已写入内存，但未能落盘（无持久磁盘时冷启动可能丢失）。本地开发请确保进程可写 .data/；生产建议挂载持久存储或在保存后确认 cron 同实例可读。",
  });
}
