"use client";

import { LoaderCircle, Mail, RotateCw } from "lucide-react";

import {
  type RenewPreviewResponse,
  type RenewTestNotificationResponse,
} from "@/components/settings-renew-actions";
import { Button } from "@/components/ui/button";
import { formatDomainDate } from "@/features/domains/utils";
import type {
  RenewRuntimeStatus,
  RenewStorageStatus,
} from "@/features/settings/use-server-renew-prefs";

export function SettingsRenewStatusBlock({
  status,
  storage,
  serverLoading,
  previewing,
  testingNotification,
  canTestNotify,
  onPreview,
  onTestNotification,
  lastPreview,
  lastTestNotification,
}: {
  status: RenewRuntimeStatus | null;
  storage: RenewStorageStatus | null;
  serverLoading: boolean;
  previewing: boolean;
  testingNotification: boolean;
  canTestNotify: boolean;
  onPreview: () => void;
  onTestNotification: () => void;
  lastPreview: RenewPreviewResponse | null;
  lastTestNotification: RenewTestNotificationResponse | null;
}) {
  const lastRunLabel = formatDateTime(status?.lastRunAt) ?? "尚未执行";
  const nextRunLabel = formatDateTime(status?.nextRunAt) ?? "等待首次运行";

  return (
    <>
      <div className="grid gap-2 text-xs font-bold sm:grid-cols-3">
        <StatusPill label="DNSHE" ok={status?.dnsheConfigured} />
        <StatusPill label="Cron" ok={status?.cronSecretConfigured} />
        <StatusPill label="Resend" ok={status?.emailConfigured} />
        <StatusPill label="Telegram Bot" ok={status?.telegramConfigured} />
        <StatusPill label="Blob" ok={storage?.blobConfigured} />
        <StatusPill label="最近结果" ok={Boolean(status?.history?.length)} />
      </div>

      <div className="border-2 border-border bg-background p-3 text-[11px] font-bold leading-5">
        <p>上次执行：{lastRunLabel}</p>
        <p>下一次执行：{nextRunLabel}</p>
        <p>发件地址：{status?.fromEmail ?? "未配置"}</p>
        <p>存储后端：{storage ? (storage.blobConfigured ? "Vercel Blob" : storage.backend === "disk" ? "本地 .data/" : storage.backend === "memory" ? "内存" : storage.backend) : "…"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={previewing || serverLoading}
          onClick={onPreview}
        >
          {previewing ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <RotateCw className="size-3.5" />
          )}
          预检候选
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={testingNotification || serverLoading || !canTestNotify}
          onClick={onTestNotification}
        >
          {testingNotification ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Mail className="size-3.5" />
          )}
          发送测试通知
        </Button>
      </div>

      {lastPreview ? (
        <div className="border-2 border-border bg-background p-2.5 text-[11px] font-bold leading-5">
          <p>
            扫描 {lastPreview.scanned ?? "—"} · 候选 {lastPreview.candidateCount ?? "—"}
            {lastPreview.source ? ` · ${lastPreview.source}` : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {(lastPreview.items ?? []).slice(0, 10).map((item) => (
              <li key={`${item.fullDomain}-${item.outcome}`}>
                {item.fullDomain}
                {typeof item.remainingDays === "number"
                  ? ` · 剩余 ${item.remainingDays} 天`
                  : ""}
                {item.errorMessage ? ` · ${item.errorMessage}` : ""}
              </li>
            ))}
          </ul>
          {lastPreview.message ? (
            <p className="mt-1 text-red-700">{lastPreview.message}</p>
          ) : null}
        </div>
      ) : null}

      {lastTestNotification ? (
        <div className="border-2 border-border bg-background p-2.5 text-[11px] font-bold leading-5">
          <p>
            测试通知{lastTestNotification.source ? ` · ${lastTestNotification.source}` : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {(lastTestNotification.channels ?? []).map((item) => (
              <li key={item.channel}>
                {item.channel === "email" ? "Email" : "Telegram"} · {item.ok ? "成功" : "失败"}
                {item.message ? ` · ${item.message}` : ""}
              </li>
            ))}
          </ul>
          {lastTestNotification.message ? (
            <p className={`mt-1 ${lastTestNotification.ok === false ? "text-red-700" : "text-foreground/70"}`}>
              {lastTestNotification.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {status?.history?.length ? (
        <div className="border-2 border-border bg-background p-3 text-[11px] font-bold leading-5">
          <p className="mb-1">最近结果</p>
          <ul className="space-y-1">
            {status.history.slice(0, 5).map((item) => (
              <li key={`${item.key}-${item.createdAt}`}>
                {item.fullDomain} · {item.outcome}
                {item.newExpiresAt ? ` · 新到期 ${item.newExpiresAt}` : ""}
                {item.errorMessage ? ` · ${item.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function StatusPill({ label, ok }: { label: string; ok?: boolean }) {
  const tone =
    ok === undefined
      ? "bg-muted text-foreground/70"
      : ok
        ? "bg-emerald-200 text-emerald-950"
        : "bg-[#ffd0d8] text-red-900";
  return (
    <span
      className={`inline-flex items-center justify-between gap-2 border-2 border-border px-2 py-1.5 shadow-shadow ${tone}`}
    >
      <span>{label}</span>
      <span>{ok === undefined ? "…" : ok ? "就绪" : "未就绪"}</span>
    </span>
  );
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${formatDomainDate(value)} ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}
