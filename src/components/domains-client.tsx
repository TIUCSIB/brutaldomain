"use client";

import { Suspense } from "react";

import { DomainsContent } from "./domains-content";

function DomainsFallback() {
  return (
    <div className="mx-auto w-full max-w-[1280px] p-6 text-sm font-bold text-foreground/70">
      正在加载域名列表…
    </div>
  );
}

export function DomainsClient() {
  return (
    <Suspense fallback={<DomainsFallback />}>
      <DomainsContent />
    </Suspense>
  );
}
