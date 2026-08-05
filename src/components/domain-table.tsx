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
import {
  DEFAULT_DOMAIN_COLUMNS,
  type DomainColumnPrefs,
} from "@/features/domains/domain-list-prefs";
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
  columns?: DomainColumnPrefs;
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
  columns = DEFAULT_DOMAIN_COLUMNS,
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
    <div className="hidden max-h-[70vh] overflow-auto lg:block">
      <Table className="min-w-[880px]">
        <TableHeader className="sticky top-0 z-10 bg-[#1261ff] text-white [&_tr]:border-slate-950">
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
            {columns.status ? (
              <TableHead className="text-white">状态</TableHead>
            ) : null}
            {columns.provider ? (
              <TableHead className="text-white">Provider</TableHead>
            ) : null}
            {columns.expiry ? (
              <TableHead className="text-white">到期时间</TableHead>
            ) : null}
            {columns.created ? (
              <TableHead className="text-white">创建时间</TableHead>
            ) : null}
            {columns.actions ? (
              <TableHead className="text-right text-white">操作</TableHead>
            ) : null}
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
                {columns.status ? (
                  <TableCell>
                    <Badge
                      className={`rounded-none border-slate-950 shadow-[2px_2px_0_0_#0f172a] ${statusStyles[domain.status]}`}
                    >
                      {domain.status}
                    </Badge>
                  </TableCell>
                ) : null}
                {columns.provider ? (
                  <TableCell>
                    <span className="border-2 border-slate-950 bg-blue-50 px-2 py-1 font-black">
                      {formatProviderLabel(domain.provider_account_id)}
                    </span>
                  </TableCell>
                ) : null}
                {columns.expiry ? (
                  <TableCell>
                    <span className="font-black">{expiry.label}</span>
                    <span
                      className={`mt-1 block w-fit px-1.5 py-0.5 text-xs font-bold ${expiryStyles[expiry.tone]}`}
                    >
                      {expiry.detail}
                    </span>
                  </TableCell>
                ) : null}
                {columns.created ? (
                  <TableCell>{formatDomainDate(domain.created_at)}</TableCell>
                ) : null}
                {columns.actions ? (
                  <TableCell className="text-right">
                    <DomainActions domain={domain} />
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
