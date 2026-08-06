"use client";

import { useState } from "react";
import { Bot, CalendarClock, Mail, RotateCw } from "lucide-react";

import {
  buildRenewDraftRequest,
  type RenewPreviewResponse,
  type RenewTestNotificationResponse,
} from "@/components/settings-renew-actions";
import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { SettingsRenewStatusBlock } from "@/components/settings-renew-status-block";
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
import { AUTO_RENEW_MAX_DAYS } from "@/features/settings/automation-prefs";
import {
  AUTO_RENEW_BATCH_LIMIT,
  type ServerRenewPrefs,
} from "@/features/settings/server-renew-prefs";
import type {
  RenewRuntimeStatus,
  RenewStorageStatus,
} from "@/features/settings/use-server-renew-prefs";
import { redirectIfUnauthorized } from "@/lib/api/request-error";

export function SettingsRenewSection({
  serverDraft,
  onServerPatch,
  status,
  storage,
  serverLoading,
}: {
  serverDraft: ServerRenewPrefs;
  onServerPatch: (patch: Partial<ServerRenewPrefs>) => void;
  status: RenewRuntimeStatus | null;
  storage: RenewStorageStatus | null;
  serverLoading: boolean;
}) {
  const [previewing, setPreviewing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [lastPreview, setLastPreview] = useState<RenewPreviewResponse | null>(null);
  const [lastTestNotification, setLastTestNotification] =
    useState<RenewTestNotificationResponse | null>(null);

  async function runPreview() {
    setPreviewing(true);
    setLastPreview(null);
    try {
      const response = await fetch("/api/settings/renew/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRenewDraftRequest(serverDraft)),
      });
      const payload =
        (await response.json().catch(() => ({}))) as RenewPreviewResponse;
      if (response.status === 401) {
        redirectIfUnauthorized(new Error("unauthorized"));
        return;
      }
      setLastPreview(payload);
      if (!response.ok || payload.ok === false) {
        toast.error("自动续费预检失败", {
          description: payload.message || `HTTP ${response.status}`,
        });
        return;
      }
      toast.success("自动续费预检完成", {
        description: `扫描 ${payload.scanned ?? 0} · 候选 ${payload.candidateCount ?? 0}`,
      });
    } catch (error) {
      if (redirectIfUnauthorized(error)) return;
      toast.error("预检请求失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setPreviewing(false);
    }
  }

  async function runTestNotification() {
    setTestingNotification(true);
    setLastTestNotification(null);
    try {
      const response = await fetch("/api/settings/renew/test-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRenewDraftRequest(serverDraft)),
      });
      const payload =
        (await response.json().catch(() => ({}))) as RenewTestNotificationResponse;
      if (response.status === 401) {
        redirectIfUnauthorized(new Error("unauthorized"));
        return;
      }
      setLastTestNotification(payload);
      const channelSummary = (payload.channels ?? [])
        .map((item) => `${item.channel === "email" ? "Email" : "Telegram"}：${item.message ?? (item.ok ? "已发送" : "失败")}`)
        .join(" · ");
      if (!response.ok || payload.ok === false) {
        toast.error("测试通知发送失败", {
          description: channelSummary || payload.message || `HTTP ${response.status}`,
        });
        return;
      }
      toast.success("测试通知已发送", {
        description: channelSummary || payload.message || "已按当前渠道发送",
      });
    } catch (error) {
      if (redirectIfUnauthorized(error)) return;
      toast.error("测试通知请求失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setTestingNotification(false);
    }
  }

  const showNotifyFields =
    serverDraft.autoRenewEnabled && serverDraft.notifyOnSuccess;
  const canTestNotify =
    showNotifyFields && (serverDraft.channelEmail || serverDraft.channelTelegram);

  return (
    <Card className="gap-0 bg-secondary-background py-0">
      <CardHeader className="border-b-2 border-border bg-main/10 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCw className="size-4" strokeWidth={2.5} />
          服务端自动续费
        </CardTitle>
        <CardDescription className="text-xs font-bold text-foreground/70">
          每 10 天执行一次
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <AutomationToggleRow
          id="auto-renew"
          label="开启服务端自动续费"
          description={`默认关闭 · ≤${AUTO_RENEW_MAX_DAYS} 天 · 最多 ${AUTO_RENEW_BATCH_LIMIT} 个`}
          checked={serverDraft.autoRenewEnabled}
          disabled={serverLoading}
          onChange={(autoRenewEnabled) => onServerPatch({ autoRenewEnabled })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 border-2 border-border bg-background p-3 shadow-shadow">
            <p className="text-xs font-black">规则</p>
            <p className="text-[11px] font-bold text-foreground/70">
              <CalendarClock className="mr-1 inline size-3.5" />
              ≤ {AUTO_RENEW_MAX_DAYS} 天自动续费，每次最多 {AUTO_RENEW_BATCH_LIMIT} 个。
            </p>
          </div>
          <div className="grid gap-2 content-start">
            <AutomationToggleRow
              id="auto-renew-registered"
              label="仅 Registered"
              description="关闭后不过滤状态"
              checked={serverDraft.autoRenewRegisteredOnly}
              disabled={serverLoading || !serverDraft.autoRenewEnabled}
              onChange={(autoRenewRegisteredOnly) =>
                onServerPatch({ autoRenewRegisteredOnly })
              }
            />
            <AutomationToggleRow
              id="auto-renew-notify"
              label="续费成功后通知"
              description="开启后显示渠道"
              checked={serverDraft.notifyOnSuccess}
              disabled={serverLoading || !serverDraft.autoRenewEnabled}
              onChange={(notifyOnSuccess) =>
                onServerPatch({ notifyOnSuccess })
              }
            />
          </div>
        </div>

        {showNotifyFields ? (
          <div className="space-y-3 border-2 border-border bg-background p-3 shadow-shadow">
            <h3 className="text-sm font-black">通知渠道</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <AutomationToggleRow
                id="renew-email"
                label="Email"
                description="邮件通知"
                checked={serverDraft.channelEmail}
                disabled={serverLoading}
                onChange={(channelEmail) => onServerPatch({ channelEmail })}
              />
              <AutomationToggleRow
                id="renew-telegram"
                label="Telegram"
                description="Telegram 通知"
                checked={serverDraft.channelTelegram}
                disabled={serverLoading}
                onChange={(channelTelegram) =>
                  onServerPatch({ channelTelegram })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="renew-email-input" className="text-xs">
                  <Mail className="mr-1 inline size-3" />
                  通知邮箱
                </Label>
                <Input
                  id="renew-email-input"
                  type="email"
                  autoComplete="email"
                  disabled={serverLoading || !serverDraft.channelEmail}
                  value={serverDraft.email}
                  onChange={(event) =>
                    onServerPatch({ email: event.target.value })
                  }
                  placeholder="you@example.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="renew-tg-input" className="text-xs">
                  Telegram Chat ID
                </Label>
                <Input
                  id="renew-tg-input"
                  disabled={serverLoading || !serverDraft.channelTelegram}
                  value={serverDraft.telegramChatId}
                  onChange={(event) =>
                    onServerPatch({ telegramChatId: event.target.value })
                  }
                  placeholder="例如 123456789"
                  className="h-9 font-mono"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="renew-tg-hint" className="text-xs">
                  Telegram 备注（可选）
                </Label>
                <Input
                  id="renew-tg-hint"
                  disabled={serverLoading || !serverDraft.channelTelegram}
                  value={serverDraft.telegramHint}
                  onChange={(event) =>
                    onServerPatch({ telegramHint: event.target.value })
                  }
                  placeholder="Bot 名称，勿填 Token"
                  className="h-9"
                />
                <p className="text-[11px] font-bold text-foreground/60">
                  <Bot className="mr-1 inline size-3" />
                  Bot Token / Resend Key 只放环境变量。
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <SettingsRenewStatusBlock
          status={status}
          storage={storage}
          serverLoading={serverLoading}
          previewing={previewing}
          testingNotification={testingNotification}
          canTestNotify={canTestNotify}
          onPreview={() => void runPreview()}
          onTestNotification={() => void runTestNotification()}
          lastPreview={lastPreview}
          lastTestNotification={lastTestNotification}
        />
      </CardContent>
    </Card>
  );
}
