"use client";

import { useState } from "react";
import { FlaskConical, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { ServerNotifyPrefs } from "@/features/settings/server-notify-prefs";
import type {
  NotifySecretsStatus,
  NotifyStorageStatus,
} from "@/features/settings/use-server-notify-prefs";
import { redirectIfUnauthorized } from "@/lib/api/request-error";

interface TestResponse {
  ok?: boolean;
  message?: string;
  scanned?: number;
  alertCount?: number;
  source?: string;
  channels?: Array<{
    channel: string;
    ok: boolean;
    skipped?: boolean;
    message?: string;
  }>;
}

export function SettingsNotifyTestBlock({
  serverDraft,
  secrets,
  storage,
}: {
  serverDraft: ServerNotifyPrefs;
  secrets: NotifySecretsStatus | null;
  storage: NotifyStorageStatus | null;
}) {
  const [testing, setTesting] = useState<"live" | "dry" | null>(null);
  const [lastResult, setLastResult] = useState<TestResponse | null>(null);

  async function runTest(dryRun: boolean) {
    if (!serverDraft.channelEmail && !serverDraft.channelTelegram) {
      toast.error("请先勾选 Email 或 Telegram 渠道");
      return;
    }
    setTesting(dryRun ? "dry" : "live");
    setLastResult(null);
    try {
      const response = await fetch("/api/settings/notify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useDraft: true,
          draft: {
            notifyEnabled: serverDraft.notifyEnabled,
            notifyDays: serverDraft.notifyDays,
            notifyExpired: serverDraft.notifyExpired,
            channelEmail: serverDraft.channelEmail,
            channelTelegram: serverDraft.channelTelegram,
            email: serverDraft.email,
            telegramChatId: serverDraft.telegramChatId,
          },
          dryRun,
          forceTestMessage: true,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as TestResponse;
      if (response.status === 401) {
        redirectIfUnauthorized(new Error("unauthorized"));
        return;
      }
      setLastResult(payload);
      if (!response.ok || payload.ok === false) {
        toast.error(dryRun ? "预检未通过" : "测试发送失败", {
          description:
            payload.message ||
            payload.channels
              ?.filter((item) => !item.ok)
              .map((item) => `${item.channel}: ${item.message}`)
              .join(" · ") ||
            `HTTP ${response.status}`,
        });
        return;
      }
      toast.success(dryRun ? "预检通过（未真实发送）" : "测试通知已发送", {
        description: `扫描 ${payload.scanned ?? 0} · 窗口内 ${payload.alertCount ?? 0}`,
      });
    } catch (error) {
      if (redirectIfUnauthorized(error)) return;
      toast.error("测试请求失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-black">
        <FlaskConical className="size-3.5" />
        状态与测试
      </h3>
      <div className="grid gap-2 text-xs font-bold sm:grid-cols-3">
        <StatusPill label="Resend" ok={secrets?.emailConfigured} />
        <StatusPill label="Telegram Bot" ok={secrets?.telegramConfigured} />
        <StatusPill label="Cron" ok={secrets?.cronSecretConfigured} />
        <StatusPill label="Blob" ok={storage?.blobConfigured} />
        <StatusPill
          label={`存储 ${storage?.backend ?? "…"}`}
          ok={
            storage
              ? storage.backend === "blob" || storage.backend === "disk"
              : undefined
          }
        />
        <StatusPill
          label="远程渠道"
          ok={serverDraft.channelEmail || serverDraft.channelTelegram}
        />
      </div>
      <p className="text-[11px] font-bold leading-5 text-foreground/65">
        测试用当前表单草稿；定时任务用已保存配置
        {storage?.storePath ? `（${storage.storePath}）` : ""}。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={testing !== null}
          onClick={() => void runTest(true)}
        >
          {testing === "dry" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <FlaskConical className="size-3.5" />
          )}
          预检
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={testing !== null}
          onClick={() => void runTest(false)}
        >
          {testing === "live" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          发送测试
        </Button>
      </div>
      {lastResult ? (
        <div className="border-2 border-border bg-background p-2.5 text-[11px] font-bold leading-5">
          <p>
            扫描 {lastResult.scanned ?? "—"} · 窗口内{" "}
            {lastResult.alertCount ?? "—"}
            {lastResult.source ? ` · ${lastResult.source}` : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {(lastResult.channels ?? []).map((item) => (
              <li key={item.channel}>
                {item.ok ? "✓" : "✗"} {item.channel}
                {item.skipped ? "（跳过）" : ""}：{item.message}
              </li>
            ))}
          </ul>
          {lastResult.message ? (
            <p className="mt-1 text-red-700">{lastResult.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
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
