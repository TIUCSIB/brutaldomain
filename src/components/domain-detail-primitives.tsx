import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";

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
  "rounded-none border-border shadow-shadow focus-visible:ring-2 focus-visible:ring-ring";

export function LoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="正在加载域名详情"
      className="mx-auto w-full max-w-[1280px] space-y-4"
    >
      <Skeleton className="h-8 w-36 rounded-none border-2 border-border bg-secondary-background" />
      <Skeleton className="h-28 w-full rounded-none border-2 border-border bg-secondary-background" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-none border-2 border-border bg-secondary-background" />
        <Skeleton className="h-52 rounded-none border-2 border-border bg-secondary-background" />
      </div>
    </div>
  );
}

export function NotFoundState({ id }: { id: string }) {
  return (
    <div className="mx-auto grid min-h-[calc(100svh-12rem)] max-w-3xl place-items-center py-6">
      <section className="relative w-full overflow-hidden border-2 border-border bg-secondary-background p-5 shadow-shadow sm:p-7">
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-8 size-28 rotate-12 border-2 border-border bg-[#ffd84d]"
        />
        <div className="relative max-w-2xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-main">
            404 · 域名不存在
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            域名没有找到
          </h1>
          <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-foreground/70">
            ID{" "}
            <span className="break-all border-2 border-border bg-main/15 px-1.5 py-0.5 font-mono text-foreground">
              {id}
            </span>{" "}
            不存在，或已从当前数据源中移除。
          </p>
          <Button asChild size="sm" className={`mt-5 ${hardButton}`}>
            <Link href="/domains">
              <ArrowLeft />
              返回域名清单
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export function InfoItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 gap-2.5 border-b border-border/60 py-2.5 last:border-b-0">
      <span className="grid size-8 shrink-0 place-items-center border-2 border-border bg-main/15">
        <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-foreground/55">
          {label}
        </dt>
        <dd
          className={`mt-0.5 break-all text-sm font-black ${mono ? "font-mono" : ""}`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
