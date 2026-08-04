import { NextResponse } from "next/server";

import { activitiesFixture, domainsFixture, dnsRecordsFixture } from "@/data/domains";
import {
  createMockDomainDetailResponse,
  createMockDomainListResponse,
} from "@/features/domains/domain-repository";
import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  addDomain,
  formatDateTime,
  resetDemoData,
} from "@/features/domains/mock-domain-repository";
import type { AddDomainInput } from "@/features/domains/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      createMockDomainListResponse(domainsFixture, activitiesFixture),
    );
  }

  const repository = new DnsheDomainRepository();
  const result = await repository.listDomains();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const input = (await request.json()) as AddDomainInput;

  if (!isDnsheConfigured()) {
    const result = addDomain(resetDemoData(), input, formatDateTime(new Date()));
    return NextResponse.json(
      createMockDomainDetailResponse(
        result.value,
        dnsRecordsFixture.filter((record) => record.domain_id === result.value.id),
        result.state.activities.filter((activity) => activity.domain_id === result.value.id),
      ),
    );
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.registerDomain(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Register failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
