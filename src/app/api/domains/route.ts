import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import type { AddDomainInput } from "@/features/domains/types";
import { DNSHE_NOT_CONFIGURED_MESSAGE } from "@/lib/api/dnshe-config-error";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.listDomains();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: DNSHE_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  const input = (await request.json()) as AddDomainInput;
  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.registerDomain(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Register failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
