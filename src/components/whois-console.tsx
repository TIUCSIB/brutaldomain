"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { History, Radar, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WhoisResultPanel } from "@/components/whois-result-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { lookupWhois } from "@/features/settings/api";
import type { WhoisLookupResult } from "@/features/settings/types";
import {
  clearWhoisHistory,
  pushWhoisHistory,
  readWhoisHistory,
  type WhoisHistoryEntry,
} from "@/features/settings/whois-history";
import {
  classifyError,
  errorHint,
  errorTitle,
  redirectIfUnauthorized,
} from "@/lib/api/request-error";

const HISTORY_EVENT = "brutaldomain-whois-history";

function subscribeHistory(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(HISTORY_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(HISTORY_EVENT, handler);
  };
}

function getHistorySnapshot() {
  return JSON.stringify(readWhoisHistory());
}

function getServerHistorySnapshot() {
  return "[]";
}

function notifyHistory() {
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function WhoisConsole() {
  const { domains } = useDomainStore();
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<WhoisLookupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyJson = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );
  const history = useMemo(
    () => JSON.parse(historyJson) as WhoisHistoryEntry[],
    [historyJson],
  );

  const matchedDomain = useMemo(() => {
    if (!result) return null;
    const target = result.domain.toLowerCase();
    return (
      domains.find(
        (item) =>
          item.full_domain.toLowerCase() === target ||
          item.rootdomain.toLowerCase() === target,
      ) ?? null
    );
  }, [domains, result]);

  async function runLookup(query: string) {
    const normalized = query.trim();
    if (!normalized) return;

    setDomain(normalized);
    setSubmitting(true);
    setError(null);
    try {
      const next = await lookupWhois(normalized);
      setResult(next);
      pushWhoisHistory(next);
      notifyHistory();
      toast.success("WHOIS 查询成功");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      const classified = classifyError(caught);
      const message = classified.message || "WHOIS 查询失败";
      setError(message);
      setResult(null);
      toast.error(errorTitle(classified.kind), {
        description: errorHint(classified.kind) || message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runLookup(domain);
  }

  function handleClearHistory() {
    clearWhoisHistory();
    notifyHistory();
    toast.success("已清空查询历史");
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

        {history.length > 0 ? (
          <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-black">
                <History className="size-3.5" />
                最近查询
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={handleClearHistory}
              >
                <Trash2 className="size-3.5" />
                清空
              </Button>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {history.map((item) => (
                <li key={`${item.domain}-${item.queriedAt}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-none px-2 text-xs"
                    disabled={submitting}
                    onClick={() => void runLookup(item.domain)}
                    title={item.status}
                  >
                    {item.domain}
                    <span className="text-foreground/55">
                      {item.registered ? "已注册" : "未注册"}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {result ? (
          <WhoisResultPanel result={result} matchedDomain={matchedDomain} />
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
