import { NextResponse } from "next/server";

import {
  activitiesFixture,
  dnsRecordsFixture,
  domainsFixture,
} from "@/data/domains";
import { createMockDomainDetailResponse } from "@/features/domains/domain-repository";
import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import {
  deleteDomain,
  formatDateTime,
  resetDemoData,
} from "@/features/domains/mock-domain-repository";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return NextResponse.json({ message: "Invalid domain id" }, { status: 400 });
  }

  if (!isDnsheConfigured()) {
    const domain = domainsFixture.find((item) => item.id === domainId);

    if (!domain) {
      return NextResponse.json({ message: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json(
      createMockDomainDetailResponse(
        domain,
        dnsRecordsFixture.filter((record) => record.domain_id === domainId),
        activitiesFixture.filter((activity) => activity.domain_id === domainId),
      ),
    );
  }

  const repository = new DnsheDomainRepository();

  try {
    const result = await repository.getDomain(domainId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Domain lookup failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function DELETE(
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
      deleteDomain(resetDemoData(), domainId, formatDateTime(new Date()));
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      return NextResponse.json({ message }, { status: 400 });
    }
  }

  const repository = new DnsheDomainRepository();

  try {
    await repository.deleteDomain(domainId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
