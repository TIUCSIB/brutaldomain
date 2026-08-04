import { Cloud, CloudOff, FilePenLine, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DnsRecord } from "@/features/domains/types";

interface DnsRecordsViewProps {
  canWrite: boolean;
  domainId: number;
  onEdit: (record: DnsRecord) => void;
  onDelete: (record: DnsRecord) => void;
  records: DnsRecord[];
}

export function DnsRecordsView({ canWrite, domainId, onDelete, onEdit, records }: DnsRecordsViewProps) {
  if (records.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-lg font-black">No DNS records / 暂无解析记录</p>
        <p className="mt-2 text-sm font-bold text-slate-600">Add a record to point this domain to a service.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">DNS records for domain {domainId}</caption>
          <thead className="bg-slate-950 text-white"><tr>{["Type", "Name / 名称", "Content / 内容", "TTL", "Proxy", "Actions / 操作"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-black">{heading}</th>)}</tr></thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t-2 border-slate-950 first:border-t-0 hover:bg-blue-50">
                <td className="px-4 py-4"><span className="inline-flex border-2 border-slate-950 bg-[#ffd84d] px-2 py-1 font-black shadow-[2px_2px_0_0_#0f172a]">{record.type}</span></td>
                <td className="px-4 py-4 font-mono font-black">{record.name}</td>
                <td className="max-w-xs break-all px-4 py-4 font-mono font-bold text-slate-700">{record.content}</td>
                <td className="px-4 py-4 font-bold">{record.ttl}</td>
                <td className="px-4 py-4"><span className="inline-flex items-center gap-1 font-bold">{record.proxied ? <Cloud aria-hidden="true" className="text-blue-700" /> : <CloudOff aria-hidden="true" className="text-slate-500" />}{record.proxied ? "On" : "DNS only"}</span></td>
                <td className="px-4 py-4"><div className="flex gap-2"><Button type="button" variant="outline" size="icon" disabled={!canWrite} onClick={() => onEdit(record)} aria-label={`编辑 ${record.type} ${record.name}`} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"><FilePenLine /></Button><Button type="button" variant="outline" size="icon" disabled={!canWrite} onClick={() => onDelete(record)} aria-label={`删除 ${record.type} ${record.name}`} className="rounded-none border-slate-950 bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_#0f172a] hover:bg-red-600 hover:text-white"><Trash2 /></Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 md:hidden">
        {records.map((record) => (
          <article key={record.id} className="border-2 border-slate-950 bg-blue-50 p-4 shadow-[3px_3px_0_0_#0f172a]">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="inline-flex border-2 border-slate-950 bg-[#ffd84d] px-2 py-0.5 text-xs font-black">{record.type}</span><h3 className="mt-2 break-all font-mono text-lg font-black">{record.name}</h3></div><span className="inline-flex shrink-0 items-center gap-1 text-xs font-black">{record.proxied ? <Cloud aria-hidden="true" className="text-blue-700" /> : <CloudOff aria-hidden="true" />}{record.proxied ? "Proxied" : "DNS only"}</span></div>
            <p className="mt-3 break-all border-y-2 border-slate-950 py-3 font-mono text-sm font-bold">{record.content}</p>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-black text-slate-600">TTL {record.ttl}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={!canWrite} onClick={() => onEdit(record)} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"><FilePenLine /> Edit</Button><Button type="button" variant="outline" size="icon" disabled={!canWrite} onClick={() => onDelete(record)} aria-label={`删除 ${record.type} ${record.name}`} className="rounded-none border-slate-950 bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_#0f172a] hover:bg-red-600 hover:text-white"><Trash2 /></Button></div></div>
          </article>
        ))}
      </div>
    </>
  );
}
