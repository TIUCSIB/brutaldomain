"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Construction, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

interface PrototypeSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  bullets: string[];
}

export function PrototypeSection({
  eyebrow,
  title,
  description,
  icon,
  bullets,
}: PrototypeSectionProps) {
  const [search, setSearch] = useState("");

  return (
    <AppShell searchValue={search} onSearchChange={setSearch}>
      <div className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-5xl place-items-center py-6">
        <section className="relative w-full border-4 border-border bg-secondary-background p-6 shadow-[8px_8px_0_0_#1261ff] sm:p-10">
          <span className="absolute -right-3 -top-3 grid size-14 rotate-6 place-items-center border-2 border-border bg-[#ffd84d] shadow-[3px_3px_0_0_#0f172a]">
            {icon}
          </span>
          <p className="pr-16 text-xs font-black uppercase tracking-[0.2em] text-main">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-slate-600">{description}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex gap-3 border-2 border-border bg-blue-50 p-4 font-bold shadow-[3px_3px_0_0_#0f172a]">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-main" aria-hidden="true" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-border pt-6">
            <span className="inline-flex items-center gap-2 bg-[#ffd84d] px-3 py-2 text-sm font-black">
              <Construction className="size-4" aria-hidden="true" /> UI prototype / 原型占位
            </span>
            <Button asChild variant="outline" className="rounded-none border-border bg-white shadow-[3px_3px_0_0_#0f172a] hover:bg-blue-100">
              <Link href="/dashboard"><ArrowLeft aria-hidden="true" />Back to Dashboard / 返回总览</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
