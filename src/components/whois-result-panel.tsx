"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Globe2,
  Mail,
  Radar,
  Server,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { Subdomain } from "@/features/domains/types";
import type { WhoisLookupResult } from "@/features/settings/types";

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label}已复制`);
  } catch {
    toast.error("复制失败");
  }
}

function ResultRow({
  icon: Icon,
  label,
  value,
  copyValue,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  copyValue?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex min-w-0 items-start gap-2.5 border-b border-border/60 py-2.5 last:border-b-0">
      <span className="grid size-8 shrink-0 place-items-center border-2 border-border bg-main/15">
        <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-foreground/55">
          {label}
        </dt>
        <dd className="mt-0.5 break-all text-sm font-black">{value}</dd>
      </div>
      {copyValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          title={`复制${label}`}
          aria-label={`复制${label}`}
          onClick={() => {
            void copyText(copyValue, label).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  );
}

export function WhoisResultPanel({
  result,
  matchedDomain,
}: {
  result: WhoisLookupResult;
  matchedDomain: Subdomain | null;
}) {
  return (
    <section
      aria-labelledby="whois-result-title"
      className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2.5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-main">
            查询结果
          </p>
          <h2
            id="whois-result-title"
            className="mt-1 text-lg font-black tracking-tight"
          >
            {result.domain}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {matchedDomain ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/domains/${matchedDomain.id}`}>打开域名详情</Link>
            </Button>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 border-2 border-border px-2 py-1 text-xs font-black shadow-shadow ${
              result.registered
                ? "bg-[#66e58a] text-foreground"
                : "bg-[#ffd84d] text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {result.registered ? "已注册" : "未注册"}
          </span>
        </div>
      </div>

      <dl>
        <ResultRow icon={Globe2} label="状态" value={result.status} />
        <ResultRow
          icon={ShieldCheck}
          label="是否注册"
          value={result.registered ? "是" : "否"}
        />
        {result.registered_at ? (
          <ResultRow
            icon={CalendarDays}
            label="注册时间"
            value={result.registered_at}
            copyValue={result.registered_at}
          />
        ) : null}
        {result.expires_at ? (
          <ResultRow
            icon={CalendarDays}
            label="到期时间"
            value={result.expires_at}
            copyValue={result.expires_at}
          />
        ) : null}
        {result.registrant_email ? (
          <ResultRow
            icon={Mail}
            label="注册邮箱"
            value={result.registrant_email}
            copyValue={result.registrant_email}
          />
        ) : null}
        {result.nameservers?.length ? (
          <ResultRow
            icon={Server}
            label="名称服务器"
            value={result.nameservers.join(", ")}
            copyValue={result.nameservers.join("\n")}
          />
        ) : null}
        {result.message ? (
          <ResultRow icon={Radar} label="消息" value={result.message} />
        ) : null}
        {result.rate_limit ? (
          <ResultRow
            icon={Radar}
            label="速率限制"
            value={`剩余 ${result.rate_limit.remaining}/${result.rate_limit.limit} · 重置 ${result.rate_limit.reset_at}`}
          />
        ) : null}
      </dl>
    </section>
  );
}
