"use client";

import {
  Bell,
  Bot,
  Mail,
  MonitorSmartphone,
} from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { SettingsNotifyTestBlock } from "@/components/settings-notify-test-block";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutomationPrefs } from "@/features/settings/automation-prefs";
import {
  EXPIRY_NOTIFY_DAY_OPTIONS,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import type {
  NotifySecretsStatus,
  NotifyStorageStatus,
} from "@/features/settings/use-server-notify-prefs";

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

        <SettingsNotifyTestBlock
          serverDraft={serverDraft}
          secrets={secrets}
          storage={storage}
        />
      </CardContent>
    </Card>
  );
}
