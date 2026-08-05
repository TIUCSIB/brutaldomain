import { NextResponse } from "next/server";

import { getNotifyEnvStatus } from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";
import {
  getNotifyPrefsStorePath,
  readServerNotifyPrefs,
} from "@/lib/notify/prefs-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const prefs = await readServerNotifyPrefs();
  const secrets = getNotifyEnvStatus();
  return NextResponse.json({
    dnsheConfigured: isDnsheConfigured(),
    ...secrets,
    prefs,
    storePath: getNotifyPrefsStorePath(),
  });
}
