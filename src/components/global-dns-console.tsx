"use client";

import { useMemo, useState } from "react";
import { Loader2, Radar, RefreshCw, Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import {
  GlobalDnsResults,
  type GlobalDnsHit,
} from "@/components/global-dns-results";
import { GlobalDnsSkeleton } from "@/components/page-skeletons";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { DNS_RECORD_TYPES, type DnsRecordType } from "@/features/domains/types";
import { getErrorMessage } from "@/features/domains/utils";

const SCAN_CONCURRENCY = 4;

export function GlobalDnsConsole() {
  const {
    domains,
    error,
    getDnsRecords,
    hasDomainDetailCache,
    hydrated,
    initialized,
    loading,
    refreshDomainDetail,
    refreshDomains,
  } = useDomainStore();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DnsRecordType | "all">("all");
  const [scanning, setScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [scanErrors, setScanErrors] = useState(0);
  const [hits, setHits] = useState<GlobalDnsHit[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const cachedCount = useMemo(
    () => domains.filter((domain) => hasDomainDetailCache(domain.id)).length,
    [domains, hasDomainDetailCache],
  );

  async function scanAll(force = false) {
    if (domains.length === 0) {
      toast.error("暂无域名可扫描");
      return;
    }
    setScanning(true);
    setHasScanned(true);
    setScannedCount(0);
    setScanErrors(0);
    const nextHits: GlobalDnsHit[] = [];
    let done = 0;
    let failed = 0;
    const queue = [...domains];

    async function worker() {
      while (queue.length > 0) {
        const domain = queue.shift();
        if (!domain) return;
        try {
          if (force || !hasDomainDetailCache(domain.id)) {
            await refreshDomainDetail(domain.id, { force });
          }
          for (const record of getDnsRecords(domain.id)) {
            nextHits.push({
              domainId: domain.id,
              fullDomain: domain.full_domain,
              record,
            });
          }
        } catch {
          failed += 1;
        } finally {
          done += 1;
          setScannedCount(done);
        }
      }
    }

    try {
      await Promise.all(
        Array.from({ length: Math.min(SCAN_CONCURRENCY, domains.length) }, () =>
          worker(),
        ),
      );
      setHits(nextHits);
      setScanErrors(failed);
      toast.success(
        failed > 0
          ? `扫描完成（${failed} 个域名失败）`
          : `已扫描 ${domains.length} 个域名`,
        { description: `共收集 ${nextHits.length} 条 DNS 记录` },
      );
    } catch (caught) {
      toast.error("扫描失败", { description: getErrorMessage(caught) });
    } finally {
      setScanning(false);
    }
  }

  const filteredHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hits.filter((hit) => {
      if (typeFilter !== "all" && hit.record.type !== typeFilter) return false;
      if (!q) return true;
      return [
        hit.fullDomain,
        hit.record.type,
        hit.record.name,
        hit.record.content,
        String(hit.record.ttl),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [hits, query, typeFilter]);

  if (!hydrated || (!initialized && loading && domains.length === 0)) {
    return <GlobalDnsSkeleton />;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="DNS"
          title="全局 DNS 搜索"
          description="跨域名检索已加载的解析记录。首次使用需扫描各域名详情。"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || scanning}
                onClick={() => void refreshDomains()}
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
                同步域名
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!initialized || scanning || domains.length === 0}
                onClick={() => void scanAll(false)}
              >
                {scanning ? <Loader2 className="animate-spin" /> : <Radar />}
                {scanning
                  ? `扫描中 ${scannedCount}/${domains.length}`
                  : "扫描 DNS"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!initialized || scanning || domains.length === 0}
                onClick={() => void scanAll(true)}
              >
                强制重扫
              </Button>
            </div>
          }
        />

        <ConfigErrorBanner error={error} />

        <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
            <div className="space-y-1">
              <Label htmlFor="global-dns-q" className="text-xs">
                关键词
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-foreground/50" />
                <Input
                  id="global-dns-q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="域名 / 类型 / 名称 / 内容"
                  className="h-9 pl-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">类型</Label>
              <Select
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as DnsRecordType | "all")
                }
              >
                <SelectTrigger className="h-9 rounded-none">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <p className="text-[11px] font-bold text-foreground/65">
                域名 {domains.length} · 已缓存详情 {cachedCount} · 命中{" "}
                {filteredHits.length}/{hits.length}
                {scanErrors > 0 ? ` · 失败 ${scanErrors}` : ""}
              </p>
            </div>
          </div>
        </section>

        <GlobalDnsResults hits={filteredHits} hasScanned={hasScanned} />
      </div>
    </AppShell>
  );
}
