"use client";

import { useState } from "react";
import { CalendarClock, InfinityIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { Subdomain } from "@/features/domains/types";
import { getExpiryDays } from "@/features/domains/utils";

interface ExpiryCardProps {
  domain: Subdomain;
}

const DAY_IN_MS = 86_400_000;

function parseDateTime(value: string): number | null {
  const time = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(time) ? null : time;
}

export function ExpiryCard({ domain }: ExpiryCardProps) {
  const [now] = useState(() => Date.now());
  const createdAt = parseDateTime(domain.created_at);
  const expiresAt = parseDateTime(domain.expires_at);
  const daysRemaining = getExpiryDays(domain, new Date(now));
  const hasLifetimeRange = createdAt !== null && expiresAt !== null;
  const totalLifetime = hasLifetimeRange ? Math.max(1, expiresAt - createdAt) : DAY_IN_MS;
  const remainingLifetime = expiresAt === null ? totalLifetime : expiresAt - now;
  const progress = domain.never_expires ? 100 : Math.max(0, Math.min(100, (remainingLifetime / totalLifetime) * 100));
  const urgency = daysRemaining !== null && daysRemaining <= 30;

  return (
    <section aria-labelledby="expiry-title" className="border-2 border-slate-950 bg-white p-5 shadow-[5px_5px_0_0_#0f172a] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Expiry / 有效期</p>
          <h2 id="expiry-title" className="mt-2 text-2xl font-black tracking-tight">{domain.never_expires ? "永久有效" : daysRemaining === null ? "未提供到期时间" : `${daysRemaining.toLocaleString()} 天`}</h2>
          <p className="mt-1 text-sm font-bold text-slate-600">{domain.never_expires ? "This domain never expires" : daysRemaining === null ? "Expiry data is unavailable / 暂无到期信息" : urgency ? "即将到期 · Renew soon" : "Remaining until expiration / 剩余时间"}</p>
        </div>
        <div className={`grid size-12 shrink-0 place-items-center border-2 border-slate-950 shadow-[3px_3px_0_0_#0f172a] ${urgency && !domain.never_expires ? "bg-[#ff5c7a] text-white" : "bg-[#ffd84d]"}`}>{domain.never_expires ? <InfinityIcon aria-hidden="true" /> : <CalendarClock aria-hidden="true" />}</div>
      </div>

      <Progress value={progress} aria-label="域名有效期剩余进度 Domain lifetime remaining" className="mt-6 h-5 rounded-none border-slate-950 bg-blue-100 shadow-none [&_[data-slot=progress-indicator]]:bg-[#1261ff]" />
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-black text-slate-600"><span>Created {domain.created_at || "—"}</span><span>{domain.never_expires ? "No expiration" : `Expires ${domain.expires_at || "—"}`}</span></div>
    </section>
  );
}
