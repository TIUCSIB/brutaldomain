"use client";

import { DomainStoreProvider } from "@/features/domains/domain-store";

import { DashboardContent } from "./dashboard-content";

export function DashboardClient() {
  return (
    <DomainStoreProvider>
      <DashboardContent />
    </DomainStoreProvider>
  );
}
