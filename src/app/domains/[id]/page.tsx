import { DomainDetailClient } from "@/components/domain-detail-client";
import { DomainStoreProvider } from "@/features/domains/domain-store";

interface DomainDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { id } = await params;

  return (
    <DomainStoreProvider>
      <DomainDetailClient id={id} />
    </DomainStoreProvider>
  );
}
