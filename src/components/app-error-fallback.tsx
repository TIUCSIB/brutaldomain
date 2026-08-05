import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AppErrorFallback({
  title,
  description,
  digest,
  onRetry,
  homeHref = "/dashboard",
}: {
  title: string;
  description: string;
  digest?: string;
  onRetry?: () => void;
  homeHref?: string;
}) {
  return (
    <div className="grid min-h-[60svh] place-items-center bg-background p-4 text-foreground">
      <div className="w-full max-w-lg border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <span className="inline-block -rotate-1 border-2 border-border bg-[#ff5c7a] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-shadow">
          Error
        </span>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm font-bold text-foreground/75">{description}</p>
        {digest ? (
          <p className="mt-3 break-all border-2 border-border bg-main/5 px-2.5 py-2 font-mono text-[11px] font-bold text-foreground/70">
            digest: {digest}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {onRetry ? (
            <Button type="button" size="sm" onClick={onRetry}>
              重试
            </Button>
          ) : null}
          <Button asChild type="button" variant="outline" size="sm">
            <Link href={homeHref}>返回控制台</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
