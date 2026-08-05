import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DnsRecord } from "@/features/domains/types";

export type GlobalDnsHit = {
  domainId: number;
  fullDomain: string;
  record: DnsRecord;
};

export function GlobalDnsResults({
  hits,
  hasScanned,
}: {
  hits: GlobalDnsHit[];
  hasScanned: boolean;
}) {
  if (!hasScanned) {
    return (
      <section className="grid min-h-40 place-items-center border-2 border-dashed border-border bg-secondary-background p-6 text-center shadow-shadow">
        <div>
          <p className="text-base font-black">尚未扫描 DNS</p>
          <p className="mx-auto mt-1 max-w-md text-xs font-bold text-foreground/70">
            点击「扫描 DNS」按并发加载各域名详情并建立跨域索引。已缓存的详情会直接复用。
          </p>
        </div>
      </section>
    );
  }

  if (hits.length === 0) {
    return (
      <section className="grid min-h-32 place-items-center border-2 border-dashed border-border bg-secondary-background p-6 text-center">
        <div>
          <p className="text-base font-black">无匹配记录</p>
          <p className="mt-1 text-xs font-bold text-foreground/70">
            尝试调整关键词或类型筛选
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border-2 border-border bg-secondary-background shadow-shadow">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-white">
            <tr>
              {["域名", "类型", "名称", "内容", "TTL", "操作"].map((heading) => (
                <th key={heading} className="px-3 py-2.5 font-black">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hits.map((hit) => (
              <tr
                key={`${hit.domainId}-${hit.record.id}`}
                className="border-t-2 border-border hover:bg-main/10"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/domains/${hit.domainId}`}
                    className="font-black text-blue-700 underline decoration-2 underline-offset-2"
                  >
                    {hit.fullDomain}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className="border-2 border-border bg-[#ffd84d] px-1.5 py-0.5 text-xs font-black">
                    {hit.record.type}
                  </span>
                </td>
                <td className="max-w-[12rem] break-all px-3 py-2.5 font-mono text-xs font-bold">
                  {hit.record.name}
                </td>
                <td className="max-w-xs break-all px-3 py-2.5 font-mono text-xs font-bold text-foreground/80">
                  {hit.record.content}
                </td>
                <td className="px-3 py-2.5 font-bold">{hit.record.ttl}</td>
                <td className="px-3 py-2.5">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/domains/${hit.domainId}?tab=dns`}>打开</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y-2 divide-border md:hidden">
        {hits.map((hit) => (
          <li key={`${hit.domainId}-${hit.record.id}`} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{hit.fullDomain}</p>
                <p className="mt-1 text-xs font-bold">
                  <span className="border border-border bg-[#ffd84d] px-1">
                    {hit.record.type}
                  </span>{" "}
                  <span className="font-mono">{hit.record.name}</span>
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-foreground/75">
                  {hit.record.content}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/domains/${hit.domainId}?tab=dns`}>打开</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
