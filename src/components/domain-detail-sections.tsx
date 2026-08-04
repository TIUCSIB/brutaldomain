"use client";

import Link from "next/link";
import type { RefObject } from "react";
import {
  CalendarDays,
  Cloud,
  Copy,
  ExternalLink,
  Fingerprint,
  Globe2,
  RefreshCw,
  RotateCw,
  Server,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  hardButton,
  InfoItem,
  statusStyles,
} from "@/components/domain-detail-primitives";
import { ExpiryCard } from "@/components/expiry-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DomainFeatures, Subdomain } from "@/features/domains/types";
import { formatProviderLabel } from "@/features/domains/utils";

interface DomainDetailHeaderProps {
  busyAction: string | null;
  domain: Subdomain;
  features: DomainFeatures;
  onCopy: () => void;
  onFocusDanger: () => void;
  onRefresh: () => void;
  onRenew: () => void;
}

export function DomainDetailHeader({
  busyAction,
  domain,
  features,
  onCopy,
  onFocusDanger,
  onRefresh,
  onRenew,
}: DomainDetailHeaderProps) {
  return (
    <>
      <Button
        asChild
        variant="outline"
        size="sm"
        className={`bg-secondary-background hover:bg-[#ffd84d] ${hardButton}`}
      >
        <Link href="/domains">返回域名清单</Link>
      </Button>

      <header className="border-2 border-border bg-secondary-background shadow-shadow">
        <div className="h-1.5 bg-main" aria-hidden="true" />
        <div className="flex flex-col gap-3 p-3.5 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-main">
                Domain #{domain.id}
              </p>
              <Badge
                className={`rounded-none border-border shadow-shadow ${statusStyles[domain.status]}`}
              >
                {domain.status}
              </Badge>
            </div>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 [overflow-wrap:anywhere] text-xl font-black tracking-tight sm:text-3xl">
                {domain.full_domain}
              </h1>
              <button
                type="button"
                onClick={onCopy}
                aria-label="复制完整域名"
                className="grid size-8 shrink-0 place-items-center border-2 border-border bg-main/15 shadow-shadow hover:bg-[#ffd84d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Copy aria-hidden="true" className="size-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs font-bold text-foreground/70">
              管理注册信息与解析记录
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onRenew}
              disabled={!features.domainRenew || busyAction !== null}
              className={`bg-[#ffd84d] text-foreground hover:bg-amber-300 disabled:bg-muted disabled:text-muted-foreground ${hardButton}`}
            >
              <RotateCw /> 续期
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={busyAction !== null}
              className={`bg-secondary-background hover:bg-main/15 ${hardButton}`}
            >
              <RefreshCw
                className={busyAction === "refresh" ? "animate-spin" : ""}
              />
              刷新
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onFocusDanger}
              disabled={!features.domainDelete}
              className={`bg-[#ff5c7a] text-white hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground ${hardButton}`}
            >
              <Trash2 /> 删除
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

interface DomainOverviewSectionProps {
  busyAction: string | null;
  deleteConfirmation: string;
  domain: Subdomain;
  features: DomainFeatures;
  inputRef: RefObject<HTMLInputElement | null>;
  onDelete: () => void;
  onDeleteConfirmationChange: (value: string) => void;
}

export function DomainOverviewSection({
  busyAction,
  deleteConfirmation,
  domain,
  features,
  inputRef,
  onDelete,
  onDeleteConfirmationChange,
}: DomainOverviewSectionProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <section
          aria-labelledby="domain-info-title"
          className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-border pb-2.5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-main">
                注册信息
              </p>
              <h2 id="domain-info-title" className="mt-1 text-lg font-black">
                域名信息
              </h2>
            </div>
            <Globe2 aria-hidden="true" className="size-6 text-main" />
          </div>
          <dl>
            <InfoItem
              icon={Globe2}
              label="完整域名"
              value={domain.full_domain}
              mono
            />
            <InfoItem
              icon={ExternalLink}
              label="子域名"
              value={domain.subdomain}
              mono
            />
            <InfoItem
              icon={Cloud}
              label="根域名"
              value={domain.rootdomain}
              mono
            />
            <InfoItem
              icon={Server}
              label="服务商"
              value={formatProviderLabel(domain.provider_account_id)}
            />
            <InfoItem
              icon={Fingerprint}
              label="服务商标识"
              value={domain.cloudflare_zone_id ?? "—"}
              mono
            />
            <InfoItem
              icon={CalendarDays}
              label="最后更新"
              value={domain.updated_at || "—"}
              mono
            />
          </dl>
        </section>
        <ExpiryCard domain={domain} />
      </div>

      <section
        id="danger-zone"
        aria-labelledby="danger-title"
        className="border-2 border-border bg-[#fff0f3] p-3.5 shadow-shadow"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center border-2 border-border bg-[#ff5c7a] text-white shadow-shadow">
            <ShieldAlert aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-700">
              危险操作
            </p>
            <h2 id="danger-title" className="mt-0.5 text-lg font-black">
              删除此域名
            </h2>
            <p className="mt-1.5 max-w-3xl text-xs font-bold leading-5 text-foreground/80">
              删除会同时移除此域名的全部 DNS 记录，且无法撤销。输入完整域名{" "}
              {domain.full_domain} 以确认。
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-1">
            <Label
              htmlFor="delete-domain-confirmation"
              className="text-xs font-black"
            >
              完整域名
            </Label>
            <Input
              ref={inputRef}
              id="delete-domain-confirmation"
              disabled={!features.domainDelete}
              value={deleteConfirmation}
              onChange={(event) =>
                onDeleteConfirmationChange(event.target.value)
              }
              autoComplete="off"
              spellCheck={false}
              className="h-9 rounded-none border-border bg-secondary-background font-mono shadow-shadow"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onDelete}
            disabled={
              !features.domainDelete ||
              deleteConfirmation !== domain.full_domain ||
              busyAction === "delete"
            }
            className={`bg-[#ff5c7a] text-white hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground ${hardButton}`}
          >
            <Trash2 />
            {busyAction === "delete" ? "删除中…" : "永久删除"}
          </Button>
        </div>
      </section>
    </div>
  );
}
