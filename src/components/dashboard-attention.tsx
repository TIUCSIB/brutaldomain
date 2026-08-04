import Link from "next/link";
import { ArrowRight, CheckCircle2, Radar, Settings } from "lucide-react";

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
import { formatExpiry, formatProviderLabel } from "@/features/domains/utils";

export function AttentionCard({ domains }: { domains: Subdomain[] }) {
  return (
    <Card className="gap-0 bg-secondary-background py-0 text-foreground">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-[#fff7d6] px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="text-base">需关注域名</CardTitle>
          <CardDescription className="text-xs font-bold text-foreground/70">
            已过期、异常或 90 天内到期
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/domains">查看全部</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {domains.length === 0 ? (
          <div className="grid min-h-28 place-items-center px-4 py-6 text-center">
            <div>
              <CheckCircle2 className="mx-auto size-7 text-emerald-600" />
              <p className="mt-2 text-sm font-black">暂无高风险域名</p>
              <p className="mt-1 text-xs font-bold text-foreground/70">
                当前没有需要立即处理的到期项
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y-2 divide-border">
            {domains.map((domain) => {
              const expiry = formatExpiry(domain);
              return (
                <li key={domain.id}>
                  <Link
                    href={`/domains/${domain.id}`}
                    className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-main/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {domain.full_domain}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-foreground/70">
                        {formatProviderLabel(domain.provider_account_id)} ·{" "}
                        {domain.status}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit text-[11px]">
                      {expiry.detail}
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

export function DashboardQuickLinks() {
  return (
    <Card className="gap-3 bg-main/10 py-4 text-foreground">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">快捷入口</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 px-4 pb-1">
        <Button asChild variant="outline" size="sm" className="justify-between">
          <Link href="/domains">
            管理全部域名 <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-between">
          <Link href="/whois">
            <span className="inline-flex items-center gap-2">
              <Radar className="size-3.5" /> WHOIS 查询
            </span>
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-between">
          <Link href="/settings">
            <span className="inline-flex items-center gap-2">
              <Settings className="size-3.5" /> 设置与配额
            </span>
            <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
