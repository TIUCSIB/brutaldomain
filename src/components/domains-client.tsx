"use client";

import { Suspense } from "react";

import { DomainsListSkeleton } from "@/components/page-skeletons";

import { DomainsContent } from "./domains-content";

export function DomainsClient() {
  return (
    <Suspense fallback={<DomainsListSkeleton />}>
      <DomainsContent />
    </Suspense>
  );
}
