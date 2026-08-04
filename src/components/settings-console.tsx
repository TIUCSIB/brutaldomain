"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Radar, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import {
  createKey,
  deleteKey,
  fetchKeys,
  fetchQuota,
  lookupWhois,
  regenerateKey,
} from "@/features/settings/api";
import type {
  SettingsApiKey,
  SettingsKeySecretResponse,
  SettingsQuota,
  WhoisLookupResult,
} from "@/features/settings/types";

const emptyKeyForm = { ip_whitelist: "", key_name: "" };

export function SettingsConsole() {
  const [search, setSearch] = useState("");
  const [keys, setKeys] = useState<SettingsApiKey[]>([]);
  const [quota, setQuota] = useState<SettingsQuota | null>(null);
  const [keyForm, setKeyForm] = useState(emptyKeyForm);
  const [latestSecret, setLatestSecret] =
    useState<SettingsKeySecretResponse | null>(null);
  const [whoisDomain, setWhoisDomain] = useState("");
  const [whois, setWhois] = useState<WhoisLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKeyId, setBusyKeyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSettings() {
    setLoading(true);
    try {
      const [keyResult, quotaResult] = await Promise.all([
        fetchKeys(),
        fetchQuota(),
      ]);
      setKeys(keyResult.keys);
      setQuota(quotaResult.quota);
    } catch (error) {
      toast.error("Settings load failed / 设置加载失败", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleCreateKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await createKey({
        key_name: keyForm.key_name,
        ip_whitelist: keyForm.ip_whitelist || undefined,
      });
      setLatestSecret(result);
      setKeyForm(emptyKeyForm);
      await loadSettings();
      toast.success("API Key created / 已创建 API Key");
    } catch (error) {
      toast.error("Create key failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteKey(keyId: number) {
    setBusyKeyId(keyId);
    try {
      await deleteKey(keyId);
      setKeys((current) => current.filter((item) => item.id !== keyId));
      toast.success("API Key deleted / 已删除 API Key");
    } catch (error) {
      toast.error("Delete key failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusyKeyId(null);
    }
  }

  async function handleRegenerateKey(keyId: number) {
    setBusyKeyId(keyId);
    try {
      const result = await regenerateKey(keyId);
      setLatestSecret(result);
      await loadSettings();
      toast.success("Secret regenerated / 已重置 Secret");
    } catch (error) {
      toast.error("Regenerate failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusyKeyId(null);
    }
  }

  async function handleWhoisLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await lookupWhois(whoisDomain);
      setWhois(result);
      toast.success("WHOIS loaded / WHOIS 查询成功");
    } catch (error) {
      toast.error("WHOIS failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell searchValue={search} onSearchChange={setSearch}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-4 border-slate-950 bg-white p-6 shadow-[6px_6px_0_0_#1261ff]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Settings / 设置
          </p>
          <h1 className="mt-3 text-4xl font-black">DNSHE Tools Console</h1>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-600">
            当前页面接入文档中明确的 keys、quota、whois 接口。所有请求仍通过服务端 API route 转发。
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center border-2 border-slate-950 bg-[#ffd84d]"><Wallet /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quota</p><p className="text-2xl font-black">{quota ? quota.available : "—"}</p></div></div><p className="mt-3 text-sm font-bold text-slate-600">Available / 可用配额</p></div>
          <div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center border-2 border-slate-950 bg-blue-100"><KeyRound /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Keys</p><p className="text-2xl font-black">{keys.length}</p></div></div><p className="mt-3 text-sm font-bold text-slate-600">API keys / 密钥数量</p></div>
          <div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center border-2 border-slate-950 bg-green-100"><Radar /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Usage</p><p className="text-2xl font-black">{quota ? quota.used : "—"}</p></div></div><p className="mt-3 text-sm font-bold text-slate-600">Used quota / 已用配额</p></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><h2 className="text-2xl font-black">API Keys / 密钥管理</h2><form onSubmit={handleCreateKey} className="mt-4 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="key-name">Key name</Label><Input id="key-name" required value={keyForm.key_name} onChange={(event) => setKeyForm((current) => ({ ...current, key_name: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="key-ip">IP whitelist</Label><Input id="key-ip" value={keyForm.ip_whitelist} onChange={(event) => setKeyForm((current) => ({ ...current, ip_whitelist: event.target.value }))} placeholder="Optional" /></div><div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create key / 创建密钥"}</Button></div></form>{latestSecret ? <div className="mt-4 border-2 border-slate-950 bg-[#fff7d6] p-4 text-sm font-bold"><p>API Key: <code>{latestSecret.api_key}</code></p><p className="mt-2">API Secret: <code>{latestSecret.api_secret}</code></p><p className="mt-2 text-slate-600">{latestSecret.warning || "Secret only appears once."}</p></div> : null}<div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-950 text-white"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Key</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{keys.map((item) => <tr key={item.id} className="border-t-2 border-slate-950"><td className="px-3 py-3 font-black">{item.key_name}</td><td className="px-3 py-3 font-mono">{item.api_key}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3"><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={busyKeyId === item.id || loading} onClick={() => void handleRegenerateKey(item.id)}>Regenerate</Button><Button type="button" size="sm" disabled={busyKeyId === item.id || loading} onClick={() => void handleDeleteKey(item.id)} className="bg-[#ff5c7a] text-white hover:bg-red-600">Delete</Button></div></td></tr>)}</tbody></table></div></div>

          <div className="space-y-6"><div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><h2 className="text-2xl font-black">Quota / 配额</h2>{quota ? <div className="mt-4 grid gap-3 text-sm font-bold"><div>Used: {quota.used}</div><div>Base: {quota.base}</div><div>Invite bonus: {quota.invite_bonus}</div><div>Total: {quota.total}</div><div>Available: {quota.available}</div></div> : <p className="mt-3 text-sm font-bold text-slate-600">Loading…</p>}</div><div className="border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_0_#0f172a]"><h2 className="text-2xl font-black">WHOIS / 查询</h2><form onSubmit={handleWhoisLookup} className="mt-4 space-y-4"><div className="space-y-2"><Label htmlFor="whois-domain">Domain</Label><Input id="whois-domain" required value={whoisDomain} onChange={(event) => setWhoisDomain(event.target.value)} placeholder="example.com" /></div><Button type="submit" disabled={submitting}>{submitting ? "Searching…" : "Lookup WHOIS"}</Button></form>{whois ? <div className="mt-4 border-2 border-slate-950 bg-blue-50 p-4 text-sm font-bold"><div>Domain: {whois.domain}</div><div>Status: {whois.status}</div><div>Registered: {whois.registered ? "Yes" : "No"}</div>{whois.registered_at ? <div>Registered at: {whois.registered_at}</div> : null}{whois.expires_at ? <div>Expires at: {whois.expires_at}</div> : null}{whois.registrant_email ? <div>Email: {whois.registrant_email}</div> : null}{whois.nameservers?.length ? <div>Nameservers: {whois.nameservers.join(", ")}</div> : null}{whois.message ? <div>Message: {whois.message}</div> : null}</div> : null}</div></div>
        </section>
      </div>
    </AppShell>
  );
}
