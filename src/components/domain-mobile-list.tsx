import Link from "next/link";
import { CalendarClock, Server } from "lucide-react";

import { DomainActions } from "@/components/domain-actions";
import { Badge } from "@/components/ui/badge";
import type { Subdomain } from "@/features/domains/types";
import {
  formatDomainDate,
  formatExpiry,
  formatProviderLabel,
} from "@/features/domains/utils";

export interface DomainMobileListProps {
  domains: Subdomain[];
  selectedIds?: ReadonlySet<number>;
  onToggleSelect?: (id: number) => void;
}

const statusStyles = {
  Registered: "bg-[#66e58a] text-slate-950",
  Pending: "bg-[#ffd84d] text-slate-950",
  Suspended: "bg-orange-300 text-slate-950",
  Expired: "bg-[#ff5c7a] text-white",
  Error: "bg-red-600 text-white",
} as const;

const expiryStyles = {
  red: "border-red-700 bg-red-100 text-red-900",
  yellow: "border-amber-700 bg-amber-100 text-amber-950",
  green: "border-emerald-700 bg-emerald-100 text-emerald-950",
  blue: "border-blue-700 bg-blue-100 text-blue-900",
} as const;

export function DomainMobileList({
  domains,
  selectedIds,
  onToggleSelect,
}: DomainMobileListProps) {
  return (
    <ul className="grid gap-2.5 lg:hidden" aria-label="域名列表">
      {domains.map((domain) => {
        const expiry = formatExpiry(domain);
        const checked = selectedIds?.has(domain.id) ?? false;
        return (
          <li
            key={domain.id}
            className="border-2 border-border bg-secondary-background p-3 shadow-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                {onToggleSelect ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect(domain.id)}
                    aria-label={`选择 ${domain.full_domain}`}
                    className="mt-1 size-4 shrink-0 accent-main"
                  />
                ) : null}
                <div className="min-w-0">
                  <Link
                    href={`/domains/${domain.id}`}
                    className="break-all text-base font-black text-main underline decoration-2 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {domain.full_domain}
                  </Link>
                  <p className="mt-0.5 text-[11px] font-bold text-foreground/55">
                    ID {domain.id}
                  </p>
                </div>
              </div>
              <DomainActions domain={domain} />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge
                className={`rounded-none border-border shadow-shadow ${statusStyles[domain.status]}`}
              >
                {domain.status}
              </Badge>
              <span className="inline-flex items-center gap-1 border-2 border-border bg-main/10 px-1.5 py-0.5 text-[11px] font-black">
                <Server aria-hidden="true" className="size-3" />
                {formatProviderLabel(domain.provider_account_id)}
              </span>
            </div>

            <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2">
              <div className={`border-2 p-2 ${expiryStyles[expiry.tone]}`}>
                <dt className="flex items-center gap-1 text-[11px] font-black uppercase">
                  <CalendarClock aria-hidden="true" className="size-3.5" />{" "}
                  到期时间
                </dt>
                <dd className="mt-0.5 font-black">{expiry.label}</dd>
                <dd className="text-[11px] font-bold">{expiry.detail}</dd>
              </div>
              <div className="border-2 border-border bg-muted/40 p-2">
                <dt className="text-[11px] font-black uppercase">创建时间</dt>
                <dd className="mt-0.5 font-bold">
                  {formatDomainDate(domain.created_at)}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
