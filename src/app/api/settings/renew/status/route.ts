import { NextResponse } from "next/server";

import { getNextAutoRenewRunAt } from "@/features/settings/server-renew-prefs";
import { requireAuthenticatedSession } from "@/lib/auth/route-guard";
import { getNotifyEnvStatus, readCronSecret } from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";
import {
  getRenewStateBackend,
  isRenewBlobConfigured,
  readRenewState,
} from "@/lib/renew/renew-state-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth.ok) return auth.response;

  const state = await readRenewState();
  const envStatus = getNotifyEnvStatus();
  return NextResponse.json({
    dnsheConfigured: isDnsheConfigured(),
    cronSecretConfigured: Boolean(readCronSecret()),
    emailConfigured: envStatus.emailConfigured,
    telegramConfigured: envStatus.telegramConfigured,
    fromEmail: envStatus.fromEmail,
    nextRunAt: getNextAutoRenewRunAt(state.prefs.lastRunAt)?.toISOString() ?? null,
    history: [...state.history].reverse().slice(0, 10),
    storage: {
      backend: getRenewStateBackend(),
      blobConfigured: isRenewBlobConfigured(),
    },
  });
}
