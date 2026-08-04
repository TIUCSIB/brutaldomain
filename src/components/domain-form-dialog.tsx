"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { getErrorMessage } from "@/features/domains/utils";

const initialForm = {
  subdomain: "",
  rootdomain: "",
  provider: "1",
  years: "1",
  cloudflareZoneId: "",
  neverExpires: false,
};

export function DomainFormDialog() {
  const { addDomain, source } = useDomainStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const isLive = source === "dnshe";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const domain = await addDomain({
        subdomain: form.subdomain,
        rootdomain: form.rootdomain,
        provider_account_id: Number(form.provider),
        years: Number(form.years),
        never_expires: form.neverExpires,
        cloudflare_zone_id: form.cloudflareZoneId || undefined,
      });
      toast.success("Domain added / 域名已添加", { description: domain.full_domain });
      handleOpenChange(false);
    } catch (error) {
      toast.error("Add failed / 添加失败", { description: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-none border-2 border-slate-950 bg-[#1261ff] px-4 text-white shadow-[4px_4px_0_0_#0f172a] hover:bg-[#0b46c4]">
          <Plus aria-hidden="true" strokeWidth={3} /> Add Domain / 添加域名
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-none border-4 border-slate-950 bg-white text-slate-950 shadow-[8px_8px_0_0_#1261ff]">
        <DialogHeader>
          <DialogTitle className="pr-8 text-2xl">Add Domain / 添加域名</DialogTitle>
          <DialogDescription>
            {isLive
              ? "DNSHE 文档明确支持 subdomain + rootdomain 注册。"
              : "注册一个新域名到本地演示 Store。Register a domain in the local demo store."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-subdomain">Subdomain / 子域名</Label>
              <Input id="add-subdomain" required autoFocus autoComplete="off" placeholder="hello" value={form.subdomain} onChange={(event) => setForm((current) => ({ ...current, subdomain: event.target.value }))} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-rootdomain">Root domain / 根域名</Label>
              <Input id="add-rootdomain" required autoComplete="off" placeholder="example.com" value={form.rootdomain} onChange={(event) => setForm((current) => ({ ...current, rootdomain: event.target.value }))} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a]" />
            </div>
          </div>

          {isLive ? (
            <div className="border-2 border-slate-950 bg-blue-50 p-3 text-sm font-bold text-slate-700">
              DNSHE 文档当前明确展示的注册参数只有 <code>subdomain</code> 和 <code>rootdomain</code>，其余字段不会提交到真实接口。
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-provider">Provider ID / 服务商 ID</Label>
                  <Input id="add-provider" required type="number" min="1" step="1" value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-years">Years / 注册年限</Label>
                  <Input id="add-years" required type="number" min="1" max="20" step="1" disabled={form.neverExpires} value={form.years} onChange={(event) => setForm((current) => ({ ...current, years: event.target.value }))} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-zone">Zone / Provider ref <span className="font-medium text-slate-500">(optional / 可选)</span></Label>
                <Input id="add-zone" autoComplete="off" placeholder="defaults to root domain" value={form.cloudflareZoneId} onChange={(event) => setForm((current) => ({ ...current, cloudflareZoneId: event.target.value }))} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a]" />
              </div>
              <label className="flex cursor-pointer items-start gap-3 border-2 border-slate-950 bg-blue-50 p-3 font-bold"><input type="checkbox" checked={form.neverExpires} onChange={(event) => setForm((current) => ({ ...current, neverExpires: event.target.checked }))} className="mt-0.5 size-5 accent-[#1261ff]" /><span>Never expires / 永不过期<span className="mt-1 block text-xs font-medium text-slate-600">开启后忽略注册年限。</span></span></label>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a] hover:bg-slate-100">Cancel / 取消</Button>
            <Button type="submit" disabled={submitting} className="rounded-none border-slate-950 bg-[#1261ff] text-white shadow-[3px_3px_0_0_#0f172a] hover:bg-[#0b46c4]">{submitting ? "Adding…" : "Add Domain / 添加"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
