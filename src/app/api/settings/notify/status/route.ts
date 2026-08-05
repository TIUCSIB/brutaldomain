import { NextResponse } from "next/server";

import { getNotifyEnvStatus } from "@/lib/env/notify-env";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getNotifyEnvStatus();
  return NextResponse.json({
    dnsheConfigured: isDnsheConfigured(),
    ...status,
  });
}
