import { DomainDetailClient } from "@/components/domain-detail-client";

interface DomainDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { id } = await params;
  return <DomainDetailClient id={id} />;
}
