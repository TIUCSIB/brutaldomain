"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  RotateCw,
  Trash2,
} from "lucide-react";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import type { Subdomain } from "@/features/domains/types";
import { getErrorMessage } from "@/features/domains/utils";

export interface DomainActionsProps {
  domain: Subdomain;
}

export function DomainActions({ domain }: DomainActionsProps) {
  const { deleteDomain, features, refreshDomain, renewDomain } =
    useDomainStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function handleRenew() {
    setBusyAction("renew");
    try {
      const updated = await renewDomain(domain.id, 1);
      toast.success("续期成功", {
        description: `${updated.full_domain} · +1 year`,
      });
      setConfirmRenew(false);
    } catch (error) {
      toast.error("续期失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRefresh() {
    setBusyAction("refresh");
    try {
      const updated = await refreshDomain(domain.id);
      toast.success("已刷新", {
        description: `${updated.full_domain} · ${updated.status}`,
      });
    } catch (error) {
      toast.error("刷新失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    setBusyAction("delete");
    try {
      await deleteDomain(domain.id);
      toast.success("已删除", { description: domain.full_domain });
      setConfirmDelete(false);
    } catch (error) {
      toast.error("删除失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Actions for ${domain.full_domain}`}
            className="size-9 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[2px_2px_0_0_#0f172a] hover:bg-[#ffd84d]"
          >
            <MoreHorizontal aria-hidden="true" strokeWidth={3} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_0_#0f172a]"
        >
          <DropdownMenuItem
            asChild
            className="rounded-none focus:bg-blue-100 focus:text-slate-950"
          >
            <Link href={`/domains/${domain.id}`}>
              <ExternalLink aria-hidden="true" /> 查看详情
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!features.domainRenew || busyAction !== null}
            onSelect={() => setConfirmRenew(true)}
            className="rounded-none focus:bg-blue-100 focus:text-slate-950"
          >
            <RotateCw aria-hidden="true" />
            续期一年
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!features.domainRefresh || busyAction !== null}
            onSelect={handleRefresh}
            className="rounded-none focus:bg-blue-100 focus:text-slate-950"
          >
            <RefreshCw aria-hidden="true" />
            {features.domainRefresh ? "刷新状态" : "刷新（接口未提供）"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-950" />
          <DropdownMenuItem
            disabled={!features.domainDelete || busyAction !== null}
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
            className="rounded-none text-red-700 focus:bg-red-100 focus:text-red-800"
          >
            <Trash2 aria-hidden="true" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={confirmRenew}
        onOpenChange={setConfirmRenew}
        title="确认续期一年？"
        description={
          <>
            将为 <strong className="text-foreground">{domain.full_domain}</strong>{" "}
            续期 1 年，可能消耗 DNSHE 配额。
          </>
        }
        confirmLabel="确认续期"
        pending={busyAction === "renew"}
        pendingLabel="续期中…"
        tone="default"
        onConfirm={() => void handleRenew()}
      />

      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="确认删除域名？"
        description={
          <>
            <strong className="text-foreground">{domain.full_domain}</strong>{" "}
            及其 DNS 记录将被永久删除，此操作不可撤销。
          </>
        }
        confirmLabel="确认删除"
        pending={busyAction === "delete"}
        pendingLabel="删除中…"
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
