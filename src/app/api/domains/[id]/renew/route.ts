import { NextResponse } from "next/server";

import { activitiesFixture, dnsRecordsFixture } from "@/data/domains";
import { createMockDomainDetailResponse } from "@/features/domains/domain-repository";
import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  formatDateTime,
  renewDomain,
  resetDemoData,
} from "@/features/domains/mock-domain-repository";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return NextResponse.json({ message: "Invalid domain id" }, { status: 400 });
  }

  if (!isDnsheConfigured()) {
    try {
      const result = renewDomain(
        resetDemoData(),
        domainId,
        1,
        formatDateTime(new Date()),
      );
      return NextResponse.json(
        createMockDomainDetailResponse(
          result.value,
          dnsRecordsFixture.filter((record) => record.domain_id === domainId),
          activitiesFixture.filter((activity) => activity.domain_id === domainId),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Renew failed";
      return NextResponse.json({ message }, { status: 400 });
    }
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.renewDomain(domainId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Renew failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
