import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  Code2,
  Globe2,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "进入 Domain Console 域名管理后台 UI 原型。",
};

const features = [
  { icon: Globe2, label: "8 domains", note: "统一资产视图" },
  { icon: RadioTower, label: "DNS ready", note: "解析记录管理" },
  { icon: ShieldCheck, label: "Expiry radar", note: "到期风险提醒" },
];

export default function Home() {
  return (
    <main className="neobrut-grid relative min-h-svh overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div aria-hidden="true" className="absolute -left-16 top-24 size-52 rotate-12 border-4 border-border bg-[#ffd84d] shadow-[10px_10px_0_0_#0f172a]" />
      <div aria-hidden="true" className="absolute -right-20 bottom-8 size-64 -rotate-6 rounded-full border-4 border-border bg-[#66e58a] shadow-[10px_10px_0_0_#0f172a]" />

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4 border-4 border-border bg-secondary-background px-4 py-3 shadow-shadow sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center border-2 border-border bg-main text-main-foreground shadow-[3px_3px_0_0_#0f172a]">
              <CircleDotDashed className="size-6" strokeWidth={2.8} aria-hidden="true" />
            </span>
            <div className="leading-none">
              <p className="font-black tracking-tight">DOMAIN CONSOLE</p>
              <p className="mt-1 text-[11px] font-bold text-slate-500">域名控制台</p>
            </div>
          </div>
          <Badge className="rounded-none border-2 border-border bg-[#ffd84d] px-3 py-1 font-black text-foreground shadow-[2px_2px_0_0_#0f172a]">
            UI DEMO
          </Badge>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div className="relative">
            <p className="inline-block -rotate-1 border-2 border-border bg-main px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-main-foreground shadow-shadow">
              Built for your domain fleet
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-foreground sm:text-7xl lg:text-[5.5rem]">
              YOUR DOMAINS.
              <span className="mt-2 block text-main">UNDER CONTROL.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-bold leading-7 text-slate-700 sm:text-lg">
              用一个清晰、直接的工作台管理域名状态、到期时间与 DNS 记录。No clutter, just the signals that matter.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {features.map(({ icon: Icon, label, note }, index) => (
                <div
                  key={label}
                  className={`border-2 border-border p-4 shadow-[3px_3px_0_0_#0f172a] ${index === 0 ? "bg-blue-100" : index === 1 ? "bg-[#fff2b8]" : "bg-[#c9f8d5]"}`}
                >
                  <Icon className="size-6" strokeWidth={2.7} aria-hidden="true" />
                  <p className="mt-3 text-sm font-black">{label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div aria-hidden="true" className="absolute -right-4 -top-4 size-full border-4 border-border bg-main" />
            <div className="relative border-4 border-border bg-secondary-background p-6 shadow-[8px_8px_0_0_#0f172a] sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-main">Secure entry / 安全入口</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">Welcome back.</h2>
                </div>
                <span className="grid size-12 shrink-0 place-items-center border-2 border-border bg-[#ffd84d] shadow-[3px_3px_0_0_#0f172a]">
                  <LockKeyhole className="size-6" strokeWidth={2.7} aria-hidden="true" />
                </span>
              </div>

              <p className="mt-4 text-sm font-bold leading-6 text-slate-600">
                Continue with your administrator GitHub account. 此页面为视觉原型，不会发起真实 OAuth 授权。
              </p>

              <Button asChild size="lg" className="mt-7 h-13 w-full rounded-none border-border bg-foreground text-base text-white shadow-[5px_5px_0_0_#1261ff] hover:bg-slate-800">
                <Link href="/dashboard">
                  <Code2 className="size-5" aria-hidden="true" />
                  Continue with GitHub
                  <ArrowRight className="ml-auto size-5" aria-hidden="true" />
                </Link>
              </Button>

              <div className="mt-6 border-2 border-dashed border-border bg-blue-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black">
                  <CheckCircle2 className="size-5 text-main" aria-hidden="true" />
                  Demo mode is active
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  所有修改仅保存在当前浏览器 localStorage，可随时重置，不会影响真实域名。
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t-2 border-border py-4 text-xs font-bold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>DOMAIN CONSOLE · Neobrutalism UI Prototype</span>
          <span>Next.js + Vercel ready</span>
        </footer>
      </div>
    </main>
  );
}
