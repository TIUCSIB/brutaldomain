"use client";

import { useState } from "react";
import {
  Bell,
  Bot,
  FlaskConical,
  LoaderCircle,
  Mail,
  MonitorSmartphone,
  Send,
} from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { AutomationPrefs } from "@/features/settings/automation-prefs";
import {
  EXPIRY_NOTIFY_DAY_OPTIONS,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
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

export function SettingsNotifyCard({
  serverDraft,
  onServerPatch,
  localDraft,
  onLocalPatch,
  secrets,
  storage,
  serverLoading,
}: {
  serverDraft: ServerNotifyPrefs;
  onServerPatch: (patch: Partial<ServerNotifyPrefs>) => void;
  localDraft: AutomationPrefs;
  onLocalPatch: (patch: Partial<AutomationPrefs>) => void;
  secrets: NotifySecretsStatus | null;
  storage: NotifyStorageStatus | null;
  serverLoading?: boolean;
}) {
  const disabled = Boolean(serverLoading);
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
    <Card className="gap-0 bg-secondary-background py-0">
      <CardHeader className="border-b-2 border-border bg-main/10 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4" strokeWidth={2.5} />
          到期通知
        </CardTitle>
        <CardDescription className="text-xs font-bold text-foreground/70">
          本机铃铛/系统通知 + 远程 Email/Telegram + 测试，都在这一处配置
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-4">
        {/* 规则 */}
        <div className="space-y-3">
          <h3 className="text-sm font-black">提醒规则</h3>
          <AutomationToggleRow
            id="notify-enabled"
            label="启用服务端到期通知"
            description="关闭后 cron 不会发送邮件/TG；本机渠道仍可单独开关"
            checked={serverDraft.notifyEnabled}
            disabled={disabled}
            onChange={(notifyEnabled) => onServerPatch({ notifyEnabled })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="notify-days" className="text-xs">
                提前多少天
              </Label>
              <select
                id="notify-days"
                disabled={disabled || !serverDraft.notifyEnabled}
                value={serverDraft.notifyDays}
                onChange={(event) =>
                  onServerPatch({
                    notifyDays: Number(
                      event.target.value,
                    ) as ServerNotifyPrefs["notifyDays"],
                  })
                }
                className="h-9 w-full rounded-none border-2 border-border bg-background px-2 text-sm font-bold shadow-shadow"
              >
                {EXPIRY_NOTIFY_DAY_OPTIONS.map((days) => (
                  <option key={days} value={days}>
                    {days} 天内
                  </option>
                ))}
              </select>
            </div>
            <AutomationToggleRow
              id="notify-expired"
              label="包含已过期"
              description="过期后继续提醒"
              checked={serverDraft.notifyExpired}
              disabled={disabled || !serverDraft.notifyEnabled}
              onChange={(notifyExpired) => onServerPatch({ notifyExpired })}
            />
          </div>
          {serverDraft.updatedAt ? (
            <p className="text-[11px] font-bold text-foreground/55">
              服务端上次保存：{serverDraft.updatedAt}
              {serverDraft.updatedBy ? ` · ${serverDraft.updatedBy}` : ""}
            </p>
          ) : null}
        </div>

        <div className="h-px bg-border" />

        {/* 本机 */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-black">
            <MonitorSmartphone className="size-3.5" />
            本机渠道
          </h3>
          <p className="text-[11px] font-bold text-foreground/65">
            仅当前浏览器：顶栏铃铛与系统通知（打开控制台时生效）
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <AutomationToggleRow
              id="ch-inapp"
              label="站内通知"
              description="顶部通知中心"
              checked={localDraft.channelInApp}
              onChange={(channelInApp) => onLocalPatch({ channelInApp })}
            />
            <AutomationToggleRow
              id="ch-browser"
              label="浏览器通知"
              description="需系统权限"
              checked={localDraft.channelBrowser}
              onChange={(channelBrowser) => onLocalPatch({ channelBrowser })}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* 远程 */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-black">
            <Mail className="size-3.5" />
            远程渠道
          </h3>
          <p className="text-[11px] font-bold text-foreground/65">
            保存到服务端，供 cron / 测试发送。密钥仍在环境变量。
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <AutomationToggleRow
              id="ch-email"
              label="Email"
              checked={serverDraft.channelEmail}
              disabled={disabled || !serverDraft.notifyEnabled}
              onChange={(channelEmail) => onServerPatch({ channelEmail })}
            />
            <AutomationToggleRow
              id="ch-tg"
              label="Telegram"
              checked={serverDraft.channelTelegram}
              disabled={disabled || !serverDraft.notifyEnabled}
              onChange={(channelTelegram) =>
                onServerPatch({ channelTelegram })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="notify-email" className="text-xs">
                通知邮箱
              </Label>
              <Input
                id="notify-email"
                type="email"
                autoComplete="email"
                disabled={
                  disabled ||
                  !serverDraft.notifyEnabled ||
                  !serverDraft.channelEmail
                }
                value={serverDraft.email}
                onChange={(event) =>
                  onServerPatch({ email: event.target.value })
                }
                placeholder="you@example.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notify-tg" className="text-xs">
                Telegram Chat ID
              </Label>
              <Input
                id="notify-tg"
                disabled={
                  disabled ||
                  !serverDraft.notifyEnabled ||
                  !serverDraft.channelTelegram
                }
                value={serverDraft.telegramChatId}
                onChange={(event) =>
                  onServerPatch({ telegramChatId: event.target.value })
                }
                placeholder="例如 123456789"
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="notify-tg-hint" className="text-xs">
                Telegram 备注（可选）
              </Label>
              <Input
                id="notify-tg-hint"
                disabled={
                  disabled ||
                  !serverDraft.notifyEnabled ||
                  !serverDraft.channelTelegram
                }
                value={serverDraft.telegramHint}
                onChange={(event) =>
                  onServerPatch({ telegramHint: event.target.value })
                }
                placeholder="Bot 名称，勿填 Token"
                className="h-9"
              />
              <p className="text-[11px] font-bold text-foreground/60">
                <Bot className="mr-1 inline size-3" />
                Bot Token / Resend Key 只放环境变量
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* 状态 + 测试 */}
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
      </CardContent>
    </Card>
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
