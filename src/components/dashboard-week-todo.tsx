import Link from "next/link";
import {
  AlertOctagon,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Subdomain } from "@/features/domains/types";
import {
  formatExpiry,
  getExpiryDays,
  isExpiringWithin,
} from "@/features/domains/utils";

export interface WeekTodoItem {
  domain: Subdomain;
  kind: "expired" | "week" | "error";
  label: string;
}

export function buildWeekTodos(
  domains: readonly Subdomain[],
  now = new Date(),
): WeekTodoItem[] {
  const items: WeekTodoItem[] = [];

  for (const domain of domains) {
    if (domain.status === "Error") {
      items.push({ domain, kind: "error", label: "状态异常" });
      continue;
    }
    const days = getExpiryDays(domain, now);
    if (days !== null && days < 0) {
      items.push({
        domain,
        kind: "expired",
        label: `已过期 ${Math.abs(days)} 天`,
      });
      continue;
    }
    if (isExpiringWithin(domain, 7, now)) {
      items.push({
        domain,
        kind: "week",
        label: formatExpiry(domain, now).detail,
      });
    }
  }

  return items
    .sort((left, right) => {
      const rank = { expired: 0, error: 1, week: 2 } as const;
      const byKind = rank[left.kind] - rank[right.kind];
      if (byKind !== 0) return byKind;
      const leftDays = getExpiryDays(left.domain, now) ?? Number.MAX_SAFE_INTEGER;
      const rightDays =
        getExpiryDays(right.domain, now) ?? Number.MAX_SAFE_INTEGER;
      return leftDays - rightDays;
    })
    .slice(0, 8);
}

const kindTone = {
  expired: "bg-[#ff5c7a] text-white",
  error: "bg-orange-300 text-slate-950",
  week: "bg-[#ffd84d] text-slate-950",
} as const;

const kindIcon = {
  expired: CalendarClock,
  error: AlertOctagon,
  week: CircleAlert,
} as const;

export function DashboardWeekTodo({ items }: { items: WeekTodoItem[] }) {
  const expiredCount = items.filter((item) => item.kind === "expired").length;
  const weekCount = items.filter((item) => item.kind === "week").length;
  const errorCount = items.filter((item) => item.kind === "error").length;

  return (
    <Card className="gap-0 bg-secondary-background py-0 text-foreground">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-main/10 px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="text-base">本周待办</CardTitle>
          <CardDescription className="text-xs font-bold text-foreground/70">
            已过期 · 7 天内到期 · 异常
            {items.length > 0
              ? ` · ${expiredCount} 过期 / ${weekCount} 临期 / ${errorCount} 异常`
              : ""}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/domains?risk=within-7">7 天内</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="grid min-h-28 place-items-center px-4 py-6 text-center">
            <div>
              <CheckCircle2 className="mx-auto size-7 text-emerald-600" />
              <p className="mt-2 text-sm font-black">本周暂无紧急事项</p>
              <p className="mt-1 text-xs font-bold text-foreground/70">
                没有已过期、7 天内到期或异常域名
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y-2 divide-border">
            {items.map((item) => {
              const Icon = kindIcon[item.kind];
              return (
                <li key={`${item.kind}-${item.domain.id}`}>
                  <Link
                    href={`/domains/${item.domain.id}`}
                    className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-main/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {item.domain.full_domain}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-foreground/70">
                        <Icon className="size-3" aria-hidden />
                        {item.domain.status}
                      </p>
                    </div>
                    <Badge className={`w-fit text-[11px] ${kindTone[item.kind]}`}>
                      {item.label}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
