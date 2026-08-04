import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DomainStatus } from "@/features/domains/types";

export const statusStyles: Record<DomainStatus, string> = {
  Registered: "bg-[#66e58a] text-slate-950",
  Pending: "bg-[#ffd84d] text-slate-950",
  Suspended: "bg-orange-300 text-slate-950",
  Expired: "bg-[#ff5c7a] text-white",
  Error: "bg-red-600 text-white",
};

export const hardButton =
  "rounded-none border-slate-950 shadow-[3px_3px_0_0_#0f172a] focus-visible:ring-4 focus-visible:ring-blue-300";

export function LoadingState() {
  return (
    <AppShell searchValue="" onSearchChange={() => undefined}>
      <div aria-busy="true" aria-label="Loading domain details" className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-44 rounded-none border-2 border-slate-950 bg-white" />
        <Skeleton className="h-44 w-full rounded-none border-2 border-slate-950 bg-white" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-none border-2 border-slate-950 bg-white" />
          <Skeleton className="h-72 rounded-none border-2 border-slate-950 bg-white" />
        </div>
      </div>
    </AppShell>
  );
}

export function NotFoundState({ id }: { id: string }) {
  return (
    <AppShell searchValue="" onSearchChange={() => undefined}>
      <div className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-4xl place-items-center py-8">
        <section className="relative w-full overflow-hidden border-4 border-slate-950 bg-white p-6 shadow-[9px_9px_0_0_#1261ff] sm:p-10">
          <span aria-hidden="true" className="absolute -right-10 -top-10 size-40 rotate-12 border-4 border-slate-950 bg-[#ffd84d]" />
          <div className="relative max-w-2xl">
            <p className="font-mono text-sm font-black uppercase tracking-[0.22em] text-blue-700">404 · Domain missing</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">域名没有找到</h1>
            <p className="mt-5 max-w-xl text-base font-bold leading-7 text-slate-600 sm:text-lg">ID <span className="break-all border-2 border-slate-950 bg-blue-100 px-2 py-1 font-mono text-slate-950">{id}</span> 不存在，或已从当前数据源中移除。</p>
            <Button asChild className={`mt-8 bg-[#1261ff] text-white hover:bg-[#0b46c4] ${hardButton}`}><Link href="/dashboard"><ArrowLeft />Back to Dashboard / 返回</Link></Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function InfoItem({ icon: Icon, label, value, mono = false }: { icon: typeof Globe2; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 gap-3 border-b-2 border-slate-200 py-4 last:border-b-0">
      <span className="grid size-10 shrink-0 place-items-center border-2 border-slate-950 bg-blue-100"><Icon aria-hidden="true" className="size-5" strokeWidth={2.5} /></span>
      <div className="min-w-0"><dt className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">{label}</dt><dd className={`mt-1 break-all text-sm font-black ${mono ? "font-mono" : ""}`}>{value}</dd></div>
    </div>
  );
}
