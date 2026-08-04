"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Cloud, Copy, ExternalLink, Fingerprint, Globe2, RefreshCw, RotateCw, Server, ShieldAlert, Trash2 } from "lucide-react";

import { ActivityTimeline } from "@/components/activity-timeline";
import { AppShell } from "@/components/app-shell";
import { LoadingState, NotFoundState, InfoItem, hardButton, statusStyles } from "@/components/domain-detail-primitives";
import { DnsRecords } from "@/components/dns-records";
import { ExpiryCard } from "@/components/expiry-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { formatProviderLabel, getErrorMessage } from "@/features/domains/utils";

interface DomainDetailClientProps { id: string; }

export function DomainDetailClient({ id }: DomainDetailClientProps) {
  const router = useRouter();
  const { activities, features, getDnsRecords, getDomain, hydrated, initialized, isDomainDetailLoading, refreshDomain, refreshDomainDetail, renewDomain, deleteDomain, createDnsRecord, updateDnsRecord, deleteDnsRecord, source } = useDomainStore();
  const [searchValue, setSearchValue] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const dangerInputRef = useRef<HTMLInputElement>(null);
  const domain = getDomain(id);
  const detailLoading = isDomainDetailLoading(id);

  useEffect(() => { void refreshDomainDetail(id); }, [id, refreshDomainDetail]);

  const dnsRecords = useMemo(() => (domain ? getDnsRecords(domain.id) : []), [domain, getDnsRecords]);
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredDnsRecords = useMemo(() => normalizedSearch ? dnsRecords.filter((record) => [record.type, record.name, record.content].some((value) => value.toLowerCase().includes(normalizedSearch))) : dnsRecords, [dnsRecords, normalizedSearch]);
  const domainActivities = useMemo(() => domain ? activities.filter((entry) => entry.domain_id === domain.id).filter((entry) => !normalizedSearch || `${entry.action} ${entry.message}`.toLowerCase().includes(normalizedSearch)) : [], [activities, domain, normalizedSearch]);

  if (!hydrated || (!initialized && !domain) || (detailLoading && !domain)) return <LoadingState />;
  if (!domain) return <NotFoundState id={id} />;
  const currentDomain = domain;

  async function handleRenew() {
    setBusyAction("renew");
    try {
      const renewed = await renewDomain(currentDomain.id);
      toast.success("Renewal complete / 续期成功", { description: `New expiry: ${renewed.expires_at}` });
    } catch (error) {
      toast.error("Renewal failed / 续期失败", { description: getErrorMessage(error) });
    } finally { setBusyAction(null); }
  }

  async function handleRefresh() {
    setBusyAction("refresh");
    try {
      if (features.domainRefresh) await refreshDomain(currentDomain.id);
      else await refreshDomainDetail(currentDomain.id);
      toast.success("Status refreshed / 状态已刷新", { description: currentDomain.full_domain });
    } catch (error) {
      toast.error("Refresh failed / 刷新失败", { description: getErrorMessage(error) });
    } finally { setBusyAction(null); }
  }

  async function copyDomain() {
    try {
      await navigator.clipboard.writeText(currentDomain.full_domain);
      toast.success("Domain copied / 已复制域名");
    } catch { toast.error("Copy failed / 复制失败"); }
  }

  function focusDangerZone() {
    dangerInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    dangerInputRef.current?.focus({ preventScroll: true });
  }

  async function handleDelete() {
    if (deleteConfirmation !== currentDomain.full_domain) return;
    setBusyAction("delete");
    try {
      await deleteDomain(currentDomain.id);
      toast.success("Domain deleted / 域名已删除", { description: currentDomain.full_domain });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Delete failed / 删除失败", { description: getErrorMessage(error) });
    } finally { setBusyAction(null); }
  }

  return (
    <AppShell searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="outline" className={`bg-white hover:bg-[#ffd84d] ${hardButton}`}><Link href="/dashboard">Back to Dashboard / 返回</Link></Button>
        <header className="mt-6 border-4 border-slate-950 bg-white shadow-[7px_7px_0_0_#1261ff]"><div className="h-3 bg-[#1261ff]" aria-hidden="true" /><div className="flex flex-col gap-6 p-5 sm:p-7 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-blue-700">Domain #{currentDomain.id}</p><Badge className={`rounded-none border-slate-950 shadow-[2px_2px_0_0_#0f172a] ${statusStyles[currentDomain.status]}`}>{currentDomain.status}</Badge><Badge className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]">{source === "dnshe" ? "LIVE DNSHE" : "LOCAL DEMO"}</Badge></div><div className="mt-3 flex min-w-0 items-center gap-3"><h1 className="min-w-0 [overflow-wrap:anywhere] text-2xl font-black tracking-[-0.04em] sm:text-5xl">{currentDomain.full_domain}</h1><button type="button" onClick={copyDomain} aria-label="复制完整域名 Copy full domain" className="grid size-9 shrink-0 place-items-center border-2 border-slate-950 bg-blue-100 shadow-[2px_2px_0_0_#0f172a] hover:bg-[#ffd84d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"><Copy aria-hidden="true" className="size-4" /></button></div><p className="mt-3 text-sm font-bold text-slate-600">Manage registration, DNS and history / 管理注册、解析与操作记录</p></div><div className="grid gap-3 sm:grid-cols-3 xl:flex"><Button type="button" onClick={handleRenew} disabled={!features.domainRenew || busyAction !== null} className={`bg-[#ffd84d] text-slate-950 hover:bg-amber-300 disabled:bg-slate-300 disabled:text-slate-600 ${hardButton}`}><RotateCw />{features.domainRenew ? "Renew / 续期" : "Renew / 待补充"}</Button><Button type="button" variant="outline" onClick={handleRefresh} disabled={busyAction !== null} className={`bg-white hover:bg-blue-100 ${hardButton}`}><RefreshCw className={busyAction === "refresh" ? "animate-spin" : ""} />Refresh / 刷新</Button><Button type="button" onClick={focusDangerZone} disabled={!features.domainDelete} className={`bg-[#ff5c7a] text-white hover:bg-red-600 disabled:bg-slate-300 disabled:text-slate-600 ${hardButton}`}><Trash2 />{features.domainDelete ? "Delete / 删除" : "Delete / 暂不可用"}</Button></div></div></header>

        <Tabs defaultValue="overview" className="mt-8 gap-6"><div className="overflow-x-auto pb-1"><TabsList className="h-auto min-w-max rounded-none border-slate-950 bg-white p-1 shadow-[4px_4px_0_0_#0f172a]"><TabsTrigger value="overview" className="min-h-11 rounded-none data-[state=active]:border-slate-950 data-[state=active]:bg-[#1261ff] data-[state=active]:text-white">Overview / 概览</TabsTrigger><TabsTrigger value="dns" className="min-h-11 rounded-none data-[state=active]:border-slate-950 data-[state=active]:bg-[#1261ff] data-[state=active]:text-white">DNS Records <span className="border border-current px-1.5 text-xs">{dnsRecords.length}</span></TabsTrigger><TabsTrigger value="activity" className="min-h-11 rounded-none data-[state=active]:border-slate-950 data-[state=active]:bg-[#1261ff] data-[state=active]:text-white">Activity / 动态 <span className="border border-current px-1.5 text-xs">{domainActivities.length}</span></TabsTrigger></TabsList></div>
          <TabsContent value="overview" className="space-y-6"><div className="grid gap-6 lg:grid-cols-2"><section aria-labelledby="domain-info-title" className="border-2 border-slate-950 bg-white p-5 shadow-[5px_5px_0_0_#0f172a] sm:p-6"><div className="flex items-center justify-between gap-3 border-b-2 border-slate-950 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Registration / 注册</p><h2 id="domain-info-title" className="mt-2 text-2xl font-black">Domain information</h2></div><Globe2 aria-hidden="true" className="size-8 text-blue-700" /></div><dl><InfoItem icon={Globe2} label="Full domain / 完整域名" value={currentDomain.full_domain} mono /><InfoItem icon={ExternalLink} label="Subdomain / 子域" value={currentDomain.subdomain} mono /><InfoItem icon={Cloud} label="Root domain / 根域" value={currentDomain.rootdomain} mono /><InfoItem icon={Server} label="Provider / 服务商" value={formatProviderLabel(currentDomain.provider_account_id)} /><InfoItem icon={Fingerprint} label="Zone / Provider ref" value={currentDomain.cloudflare_zone_id ?? "—"} mono /><InfoItem icon={CalendarDays} label="Last updated / 最后更新" value={currentDomain.updated_at || "—"} mono /></dl></section><ExpiryCard domain={currentDomain} /></div><section id="danger-zone" aria-labelledby="danger-title" className="border-4 border-slate-950 bg-[#fff0f3] p-5 shadow-[6px_6px_0_0_#ff5c7a] sm:p-6"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center border-2 border-slate-950 bg-[#ff5c7a] text-white shadow-[3px_3px_0_0_#0f172a]"><ShieldAlert aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Danger Zone / 危险区域</p><h2 id="danger-title" className="mt-1 text-2xl font-black">Delete this domain</h2><p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-700">{features.domainDelete ? `删除会同时移除此域名的全部 DNS 记录，且无法撤销。输入完整域名 ${currentDomain.full_domain} 以确认。` : "DNSHE 第一阶段不开放真实删除，此区域仅保留后续接入位置。"}</p></div></div><div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end"><div className="grid gap-2"><Label htmlFor="delete-domain-confirmation" className="font-black">完整域名 Full domain</Label><Input ref={dangerInputRef} id="delete-domain-confirmation" disabled={!features.domainDelete} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby="delete-domain-help" className="h-11 rounded-none border-slate-950 bg-white font-mono shadow-[3px_3px_0_0_#0f172a]" /><span id="delete-domain-help" className="sr-only">Type the full domain exactly to enable deletion.</span></div><Button type="button" onClick={handleDelete} disabled={!features.domainDelete || deleteConfirmation !== currentDomain.full_domain || busyAction === "delete"} className={`h-11 bg-[#ff5c7a] text-white hover:bg-red-600 disabled:bg-slate-300 disabled:text-slate-600 ${hardButton}`}><Trash2 />{busyAction === "delete" ? "Deleting…" : "Delete forever / 永久删除"}</Button></div></section></TabsContent>
          <TabsContent value="dns"><DnsRecords domainId={currentDomain.id} records={filteredDnsRecords} source={source} canWrite={features.dnsWrite} proxyEditing={features.proxyEditing} createRecord={createDnsRecord} updateRecord={updateDnsRecord} deleteRecord={deleteDnsRecord} /></TabsContent>
          <TabsContent value="activity"><ActivityTimeline activities={domainActivities} emptyTitle={source === "dnshe" ? "No synced activity / 暂无同步动态" : undefined} emptyDescription={source === "dnshe" ? "DNSHE 文档未提供审计日志接口，当前仅展示本地 Demo 历史。" : undefined} /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
