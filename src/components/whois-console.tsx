"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  Globe2,
  Mail,
  Radar,
  Server,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { lookupWhois } from "@/features/settings/api";
import type { WhoisLookupResult } from "@/features/settings/types";

function ResultRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
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
        <dd className="mt-0.5 break-all text-sm font-black">{value}</dd>
      </div>
    </div>
  );
}

export function WhoisConsole() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<WhoisLookupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = domain.trim();
    if (!query) return;

    setSubmitting(true);
    setError(null);
    try {
      const next = await lookupWhois(query);
      setResult(next);
      toast.success("WHOIS 查询成功");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "WHOIS 查询失败";
      setError(message);
      setResult(null);
      toast.error("WHOIS 查询失败", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="工具"
          title="WHOIS 查询"
          description="查询域名注册状态、到期时间与名称服务器"
        />

        <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
          <form
            onSubmit={handleLookup}
            className="flex flex-col gap-2.5 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="whois-domain" className="text-xs">
                域名
              </Label>
              <Input
                id="whois-domain"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="example.com"
                className="h-9"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !domain.trim()}
              className="sm:min-w-28"
            >
              <Radar className="size-3.5" />
              {submitting ? "查询中…" : "查询"}
            </Button>
          </form>
          {error ? (
            <p className="mt-2.5 border-2 border-border bg-[#fff0f3] px-2.5 py-2 text-xs font-bold text-red-700">
              {error}
            </p>
          ) : null}
        </section>

        {result ? (
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
                />
              ) : null}
              {result.expires_at ? (
                <ResultRow
                  icon={CalendarDays}
                  label="到期时间"
                  value={result.expires_at}
                />
              ) : null}
              {result.registrant_email ? (
                <ResultRow
                  icon={Mail}
                  label="注册邮箱"
                  value={result.registrant_email}
                />
              ) : null}
              {result.nameservers?.length ? (
                <ResultRow
                  icon={Server}
                  label="名称服务器"
                  value={result.nameservers.join(", ")}
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
        ) : (
          <section className="grid min-h-40 place-items-center border-2 border-dashed border-border bg-secondary-background p-6 text-center shadow-shadow">
            <div>
              <span className="mx-auto grid size-12 place-items-center border-2 border-border bg-main/10 shadow-shadow">
                <Radar
                  aria-hidden="true"
                  className="size-6 text-main"
                  strokeWidth={2.5}
                />
              </span>
              <h3 className="mt-3 text-base font-black">输入域名开始查询</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs font-bold text-foreground/70">
                结果经服务端 API 转发 DNSHE whois 接口，不会暴露密钥。
              </p>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
