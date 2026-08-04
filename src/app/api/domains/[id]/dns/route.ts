import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import type { CreateDnsRecordInput } from "@/features/domains/types";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return NextResponse.json({ message: "Invalid domain id" }, { status: 400 });
  }

  const input = (await request.json()) as CreateDnsRecordInput;
  const repository = new DnsheDomainRepository();

  try {
    const record = await repository.createDnsRecord(domainId, input);
    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
