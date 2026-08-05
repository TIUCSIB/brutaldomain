"use client";

import { useState } from "react";
import { FlaskConical, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { AutomationPrefs } from "@/features/settings/automation-prefs";
import { redirectIfUnauthorized } from "@/lib/api/request-error";

interface NotifyStatus {
  dnsheConfigured: boolean;
  telegramConfigured: boolean;
  emailConfigured: boolean;
  cronSecretConfigured: boolean;
  defaultEmail: string | null;
  defaultTelegramChatId: string | null;
  fromEmail: string | null;
}

interface TestResponse {
  ok?: boolean;
  message?: string;
  scanned?: number;
  alertCount?: number;
  channels?: Array<{
    channel: string;
    ok: boolean;
    skipped?: boolean;
    message?: string;
  }>;
}

export function SettingsNotifyTestPanel({
  draft,
}: {
  draft: AutomationPrefs;
}) {
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testing, setTesting] = useState<"live" | "dry" | null>(null);
  const [lastResult, setLastResult] = useState<TestResponse | null>(null);

  async function refreshStatus() {
    setLoadingStatus(true);
    try {
      const response = await fetch("/api/settings/notify/status", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setStatus((await response.json()) as NotifyStatus);
    } catch (error) {
      if (redirectIfUnauthorized(error)) return;
      setStatus(null);
      toast.error("无法读取通知配置状态", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function runTest(dryRun: boolean) {
    if (!draft.channelEmail && !draft.channelTelegram) {
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
          windowDays: draft.notifyDays,
          includeExpired: draft.notifyExpired,
          email: draft.email,
          telegramChatId: draft.telegramChatId,
          channelEmail: draft.channelEmail,
          channelTelegram: draft.channelTelegram,
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
        description: `扫描 ${payload.scanned ?? 0} 个域名 · 窗口内 ${payload.alertCount ?? 0} 个`,
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
    <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-2">
        <h2 className="flex items-center gap-2 text-base font-black">
          <FlaskConical className="size-4" strokeWidth={2.5} />
          渠道测试
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={loadingStatus}
          onClick={() => void refreshStatus()}
        >
          {loadingStatus ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : null}
          {status ? "刷新状态" : "检查服务端配置"}
        </Button>
      </header>

      <div className="grid gap-2 text-xs font-bold sm:grid-cols-2">
        <StatusPill
          label="DNSHE"
          ok={status?.dnsheConfigured}
          loaded={status !== null}
        />
        <StatusPill
          label="Resend Email"
          ok={status?.emailConfigured}
          loaded={status !== null}
        />
        <StatusPill
          label="Telegram Bot"
          ok={status?.telegramConfigured}
          loaded={status !== null}
        />
        <StatusPill
          label="Cron Secret"
          ok={status?.cronSecretConfigured}
          loaded={status !== null}
        />
      </div>

      <p className="mt-3 text-[11px] font-bold leading-5 text-foreground/65">
        测试使用上方草稿中的邮箱 / Chat ID（无需先保存）。真实发送需配置{" "}
        <code>RESEND_API_KEY</code> / <code>TELEGRAM_BOT_TOKEN</code>
        。定时扫描：
        <code>/api/cron/expiry-notify</code> + <code>CRON_SECRET</code>。
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
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
          预检（不发送）
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
          发送测试通知
        </Button>
      </div>

      {lastResult ? (
        <div className="mt-3 border-2 border-border bg-background p-2.5 text-[11px] font-bold leading-5">
          <p>
            扫描 {lastResult.scanned ?? "—"} · 窗口内{" "}
            {lastResult.alertCount ?? "—"}
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
    </section>
  );
}

function StatusPill({
  label,
  ok,
  loaded,
}: {
  label: string;
  ok?: boolean;
  loaded: boolean;
}) {
  const tone = !loaded
    ? "bg-muted text-foreground/70"
    : ok
      ? "bg-emerald-200 text-emerald-950"
      : "bg-[#ffd0d8] text-red-900";
  return (
    <span
      className={`inline-flex items-center justify-between border-2 border-border px-2 py-1.5 shadow-shadow ${tone}`}
    >
      <span>{label}</span>
      <span>{!loaded ? "未检查" : ok ? "已配置" : "未配置"}</span>
    </span>
  );
}
