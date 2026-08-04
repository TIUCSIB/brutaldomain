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

export function DomainMobileList({ domains }: DomainMobileListProps) {
  return (
    <ul className="grid gap-4 lg:hidden" aria-label="Domain list / 域名列表">
      {domains.map((domain) => {
        const expiry = formatExpiry(domain);
        return (
          <li
            key={domain.id}
            className="border-2 border-slate-950 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/domains/${domain.id}`}
                  className="break-all text-lg font-black text-blue-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                  {domain.full_domain}
                </Link>
                <p className="mt-1 text-xs font-bold text-slate-500">ID {domain.id}</p>
              </div>
              <DomainActions domain={domain} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                className={`rounded-none border-slate-950 shadow-[2px_2px_0_0_#0f172a] ${statusStyles[domain.status]}`}
              >
                {domain.status}
              </Badge>
              <span className="inline-flex items-center gap-1 border-2 border-slate-950 bg-blue-50 px-2 py-0.5 text-xs font-black">
                <Server aria-hidden="true" className="size-3.5" />
                {formatProviderLabel(domain.provider_account_id)}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className={`border-2 p-3 ${expiryStyles[expiry.tone]}`}>
                <dt className="flex items-center gap-1.5 text-xs font-black uppercase">
                  <CalendarClock aria-hidden="true" className="size-4" /> Expires / 到期
                </dt>
                <dd className="mt-1 font-black">{expiry.label}</dd>
                <dd className="text-xs font-bold">{expiry.detail}</dd>
              </div>
              <div className="border-2 border-slate-950 bg-slate-50 p-3">
                <dt className="text-xs font-black uppercase">Created / 创建</dt>
                <dd className="mt-1 font-bold">{formatDomainDate(domain.created_at)}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
