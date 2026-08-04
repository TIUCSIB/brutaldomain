import Link from "next/link";

import { DomainActions } from "@/components/domain-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Subdomain } from "@/features/domains/types";
import {
  formatDomainDate,
  formatExpiry,
  formatProviderLabel,
} from "@/features/domains/utils";

export interface DomainTableProps {
  domains: Subdomain[];
  selectedIds?: ReadonlySet<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
}

const statusStyles = {
  Registered: "bg-[#66e58a] text-slate-950",
  Pending: "bg-[#ffd84d] text-slate-950",
  Suspended: "bg-orange-300 text-slate-950",
  Expired: "bg-[#ff5c7a] text-white",
  Error: "bg-red-600 text-white",
} as const;

const expiryStyles = {
  red: "bg-red-100 text-red-800",
  yellow: "bg-amber-100 text-amber-900",
  green: "bg-emerald-100 text-emerald-900",
  blue: "bg-blue-100 text-blue-800",
} as const;

export function DomainTable({
  domains,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: DomainTableProps) {
  const selectable = Boolean(onToggleSelect && onToggleSelectAll && selectedIds);
  const allSelected =
    selectable &&
    domains.length > 0 &&
    domains.every((domain) => selectedIds!.has(domain.id));
  const someSelected =
    selectable &&
    !allSelected &&
    domains.some((domain) => selectedIds!.has(domain.id));

  return (
    <div className="hidden lg:block">
      <Table className="min-w-[880px]">
        <TableHeader className="bg-[#1261ff] text-white [&_tr]:border-slate-950">
          <TableRow className="border-slate-950 hover:bg-[#1261ff]">
            {selectable ? (
              <TableHead className="w-10 text-white">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="全选当前页"
                  className="size-4 accent-white"
                />
              </TableHead>
            ) : null}
            <TableHead className="text-white">域名</TableHead>
            <TableHead className="text-white">状态</TableHead>
            <TableHead className="text-white">Provider</TableHead>
            <TableHead className="text-white">到期时间</TableHead>
            <TableHead className="text-white">创建时间</TableHead>
            <TableHead className="text-right text-white">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => {
            const expiry = formatExpiry(domain);
            const checked = selectedIds?.has(domain.id) ?? false;
            return (
              <TableRow
                key={domain.id}
                className="border-slate-950 bg-white hover:bg-blue-50"
              >
                {selectable ? (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect?.(domain.id)}
                      aria-label={`选择 ${domain.full_domain}`}
                      className="size-4 accent-[#1261ff]"
                    />
                  </TableCell>
                ) : null}
                <TableCell>
                  <Link
                    href={`/domains/${domain.id}`}
                    className="block max-w-64 whitespace-normal font-black text-blue-700 underline decoration-2 underline-offset-4 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                  >
                    {domain.full_domain}
                  </Link>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    ID {domain.id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`rounded-none border-slate-950 shadow-[2px_2px_0_0_#0f172a] ${statusStyles[domain.status]}`}
                  >
                    {domain.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="border-2 border-slate-950 bg-blue-50 px-2 py-1 font-black">
                    {formatProviderLabel(domain.provider_account_id)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-black">{expiry.label}</span>
                  <span
                    className={`mt-1 block w-fit px-1.5 py-0.5 text-xs font-bold ${expiryStyles[expiry.tone]}`}
                  >
                    {expiry.detail}
                  </span>
                </TableCell>
                <TableCell>{formatDomainDate(domain.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DomainActions domain={domain} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
