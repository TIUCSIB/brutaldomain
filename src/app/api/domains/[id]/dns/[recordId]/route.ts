import { NextResponse } from "next/server";

import { DnsheDomainRepository } from "@/features/domains/dnshe-domain-repository";
import type { UpdateDnsRecordInput } from "@/features/domains/types";
import { isDnsheConfigured } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";

function getDomainId(value: string): number | null {
  const domainId = Number(value);
  return Number.isSafeInteger(domainId) && domainId > 0 ? domainId : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; recordId: string }> },
) {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE API is not configured" },
      { status: 503 },
    );
  }

  const { id, recordId } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return NextResponse.json({ message: "Invalid domain id" }, { status: 400 });
  }

  const input = (await request.json()) as UpdateDnsRecordInput;
  const repository = new DnsheDomainRepository();

  try {
    const record = await repository.updateDnsRecord(domainId, recordId, input);
    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; recordId: string }> },
) {
  if (!isDnsheConfigured()) {
    return NextResponse.json(
      { message: "DNSHE API is not configured" },
      { status: 503 },
    );
  }

  const { id, recordId } = await context.params;
  const domainId = getDomainId(id);

  if (!domainId) {
    return NextResponse.json({ message: "Invalid domain id" }, { status: 400 });
  }

  const repository = new DnsheDomainRepository();

  try {
    await repository.deleteDnsRecord(domainId, recordId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
