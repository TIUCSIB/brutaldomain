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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { deleteDomain, features, refreshDomain, renewDomain, source } = useDomainStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function handleRenew() {
    setBusyAction("renew");

    try {
      const updated = await renewDomain(domain.id, 1);
      toast.success("Renewed / 续期成功", {
        description: `${updated.full_domain} · +1 year`,
      });
    } catch (error) {
      toast.error("Renew failed / 续期失败", {
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
      toast.success("Refreshed / 已刷新", {
        description: `${updated.full_domain} · ${updated.status}`,
      });
    } catch (error) {
      toast.error("Refresh failed / 刷新失败", {
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
      toast.success("Deleted / 已删除", { description: domain.full_domain });
    } catch (error) {
      toast.error("Delete failed / 删除失败", {
        description: getErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
      setConfirmDelete(false);
    }
  }

  const writesDisabled = source === "dnshe";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Actions for ${domain.full_domain} / 域名操作`}
            className="size-9 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[2px_2px_0_0_#0f172a] hover:bg-[#ffd84d]"
          >
            <MoreHorizontal aria-hidden="true" strokeWidth={3} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[4px_4px_0_0_#0f172a]"
        >
          <DropdownMenuItem asChild className="rounded-none focus:bg-blue-100 focus:text-slate-950">
            <Link href={`/domains/${domain.id}`}>
              <ExternalLink aria-hidden="true" /> Details / 查看详情
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!features.domainRenew || busyAction !== null}
            onSelect={handleRenew}
            className="rounded-none focus:bg-blue-100 focus:text-slate-950"
          >
            <RotateCw aria-hidden="true" />
            {features.domainRenew ? "Renew 1 year / 续期一年" : "Renew / 待文档补充"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!features.domainRefresh || busyAction !== null}
            onSelect={handleRefresh}
            className="rounded-none focus:bg-blue-100 focus:text-slate-950"
          >
            <RefreshCw aria-hidden="true" />
            {features.domainRefresh ? "Refresh / 刷新状态" : "Refresh / 待接通"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-950" />
          <DropdownMenuItem
            disabled={!features.domainDelete || busyAction !== null}
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
            className="rounded-none text-red-700 focus:bg-red-100 focus:text-red-800"
          >
            <Trash2 aria-hidden="true" />
            {features.domainDelete ? "Delete / 删除" : "Delete / 暂不可用"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-none border-4 border-slate-950 bg-white text-slate-950 shadow-[8px_8px_0_0_#ff5c7a]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain? / 删除域名？</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-slate-950">{domain.full_domain}</strong>
              {writesDisabled
                ? " 当前 DNSHE 集成阶段未开放真实删除。"
                : " 及其 DNS 记录将被永久删除。This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-slate-950 bg-white shadow-[3px_3px_0_0_#0f172a] hover:bg-slate-100">
              Cancel / 取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={writesDisabled || busyAction === "delete"}
              className="rounded-none border-slate-950 bg-[#ff5c7a] text-white shadow-[3px_3px_0_0_#0f172a] hover:bg-red-600"
            >
              Delete / 确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
