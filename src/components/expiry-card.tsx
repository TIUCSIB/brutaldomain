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
    <section
      aria-labelledby="expiry-title"
      className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-main">
            有效期
          </p>
          <h2 id="expiry-title" className="mt-1 text-lg font-black tracking-tight">
            {domain.never_expires
              ? "永久有效"
              : daysRemaining === null
                ? "未提供到期时间"
                : `${daysRemaining.toLocaleString()} 天`}
          </h2>
          <p className="mt-0.5 text-xs font-bold text-foreground/70">
            {domain.never_expires
              ? "该域名永不过期"
              : daysRemaining === null
                ? "暂无到期信息"
                : urgency
                  ? "即将到期，建议尽快续期"
                  : "距离到期剩余时间"}
          </p>
        </div>
        <div
          className={`grid size-9 shrink-0 place-items-center border-2 border-border shadow-shadow ${urgency && !domain.never_expires ? "bg-[#ff5c7a] text-white" : "bg-[#ffd84d]"}`}
        >
          {domain.never_expires ? (
            <InfinityIcon aria-hidden="true" className="size-4" />
          ) : (
            <CalendarClock aria-hidden="true" className="size-4" />
          )}
        </div>
      </div>

      <Progress
        value={progress}
        aria-label="域名有效期剩余进度"
        className="mt-3 h-3.5 rounded-none border-border bg-main/15 shadow-none [&_[data-slot=progress-indicator]]:bg-main"
      />
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] font-black text-foreground/65">
        <span>创建 {domain.created_at || "—"}</span>
        <span>
          {domain.never_expires
            ? "永不过期"
            : `到期 ${domain.expires_at || "—"}`}
        </span>
      </div>
    </section>
  );
}
