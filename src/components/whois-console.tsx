"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { Download, ListOrdered, Radar } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { WhoisSkeleton } from "@/components/page-skeletons";
import {
  WhoisBatchPanel,
  WhoisDiffPanel,
} from "@/components/whois-batch-panel";
import { WhoisHistorySection } from "@/components/whois-history-section";
import { WhoisResultPanel } from "@/components/whois-result-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { downloadTextFile } from "@/features/domains/dns-export";
import { useDomainStore } from "@/features/domains/domain-store";
import { lookupWhois } from "@/features/settings/api";
import type { WhoisLookupResult } from "@/features/settings/types";
import {
  diffWhois,
  whoisResultToExportText,
} from "@/features/settings/whois-diff";
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

function notifyHistory() {
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function WhoisConsole() {
  const { domains, hydrated } = useDomainStore();
  const [domain, setDomain] = useState("");
  const [batchText, setBatchText] = useState("");
  const [showBatch, setShowBatch] = useState(false);
  const [result, setResult] = useState<WhoisLookupResult | null>(null);
  const [diffLines, setDiffLines] = useState<ReturnType<typeof diffWhois>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchLog, setBatchLog] = useState<string[]>([]);

  const historyJson = useSyncExternalStore(
    subscribeHistory,
    () => JSON.stringify(readWhoisHistory()),
    () => "[]",
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
      const previous =
        history.find(
          (item) => item.domain.toLowerCase() === normalized.toLowerCase(),
        ) ?? null;
      const next = await lookupWhois(normalized);
      setResult(next);
      setDiffLines(diffWhois(previous, next));
      pushWhoisHistory(next);
      notifyHistory();
      toast.success("WHOIS 查询成功");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      const classified = classifyError(caught);
      const message = classified.message || "WHOIS 查询失败";
      setError(message);
      setResult(null);
      setDiffLines([]);
      toast.error(errorTitle(classified.kind), {
        description: errorHint(classified.kind) || message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBatch() {
    const names = batchText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast.error("请输入至少一个域名");
      return;
    }
    setBatchBusy(true);
    const logs: string[] = [];
    try {
      for (const name of names.slice(0, 20)) {
        try {
          const next = await lookupWhois(name);
          pushWhoisHistory(next);
          logs.push(
            `${name}: ${next.registered ? "已注册" : "未注册"} · ${next.status}`,
          );
        } catch (caught) {
          logs.push(`${name}: 失败 · ${classifyError(caught).message}`);
        }
      }
      notifyHistory();
      setBatchLog(logs);
      toast.success(`批量查询完成（${logs.length}）`);
    } finally {
      setBatchBusy(false);
    }
  }

  if (!hydrated) return <WhoisSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="工具"
          title="WHOIS 查询"
          description="查询域名注册状态、到期时间与名称服务器；支持历史对比与批量队列。"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={showBatch ? "default" : "outline"}
                onClick={() => setShowBatch((value) => !value)}
              >
                <ListOrdered className="size-3.5" />
                批量队列
              </Button>
              {result ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    downloadTextFile(
                      `whois-${result.domain}-${new Date().toISOString().slice(0, 10)}.txt`,
                      whoisResultToExportText(result),
                      "text/plain;charset=utf-8",
                    );
                    toast.success("已导出当前结果");
                  }}
                >
                  <Download className="size-3.5" />
                  导出结果
                </Button>
              ) : null}
            </div>
          }
        />

        <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void runLookup(domain);
            }}
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

        {showBatch ? (
          <WhoisBatchPanel
            batchText={batchText}
            onBatchTextChange={setBatchText}
            batchBusy={batchBusy}
            batchLog={batchLog}
            onRun={() => void handleBatch()}
          />
        ) : null}

        <WhoisHistorySection
          history={history}
          submitting={submitting}
          onClear={() => {
            clearWhoisHistory();
            notifyHistory();
            toast.success("已清空查询历史");
          }}
          onSelect={(value) => void runLookup(value)}
        />

        {result ? (
          <>
            <WhoisDiffPanel lines={diffLines} />
            <WhoisResultPanel result={result} matchedDomain={matchedDomain} />
          </>
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
  );
}
