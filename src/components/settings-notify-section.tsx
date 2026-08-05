"use client";

import { Bell, Bot, Mail } from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EXPIRY_NOTIFY_DAY_OPTIONS,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import type { AutomationPrefs } from "@/features/settings/automation-prefs";

export function SettingsNotifySection({
  serverDraft,
  onServerPatch,
  localDraft,
  onLocalPatch,
  serverLoading,
}: {
  serverDraft: ServerNotifyPrefs;
  onServerPatch: (patch: Partial<ServerNotifyPrefs>) => void;
  localDraft: AutomationPrefs;
  onLocalPatch: (patch: Partial<AutomationPrefs>) => void;
  serverLoading?: boolean;
}) {
  const disabled = Boolean(serverLoading);

  return (
    <>
      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
          <Bell className="size-4" strokeWidth={2.5} />
          <h2 className="text-base font-black">到期通知（服务端）</h2>
        </header>
        <p className="mb-3 text-[11px] font-bold text-foreground/65">
          以下配置保存到服务端，供定时任务与测试发送使用。密钥仍只在环境变量。
        </p>
        <div className="space-y-3">
          <AutomationToggleRow
            id="notify-enabled"
            label="启用服务端到期通知"
            description="关闭后 cron 不会发送邮件/TG"
            checked={serverDraft.notifyEnabled}
            disabled={disabled}
            onChange={(notifyEnabled) => onServerPatch({ notifyEnabled })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="notify-days" className="text-xs">
                提前多少天开始通知
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
              label="包含已过期域名"
              description="过期后继续提醒，直到处理"
              checked={serverDraft.notifyExpired}
              disabled={disabled || !serverDraft.notifyEnabled}
              onChange={(notifyExpired) => onServerPatch({ notifyExpired })}
            />
          </div>
          {serverDraft.updatedAt ? (
            <p className="text-[11px] font-bold text-foreground/55">
              上次保存：{serverDraft.updatedAt}
              {serverDraft.updatedBy ? ` · ${serverDraft.updatedBy}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
          <Mail className="size-4" strokeWidth={2.5} />
          <h2 className="text-base font-black">远程渠道（服务端）</h2>
        </header>
        <div className="grid gap-2 sm:grid-cols-2">
          <AutomationToggleRow
            id="ch-email"
            label="Email"
            description="收件地址保存在服务端"
            checked={serverDraft.channelEmail}
            disabled={disabled || !serverDraft.notifyEnabled}
            onChange={(channelEmail) => onServerPatch({ channelEmail })}
          />
          <AutomationToggleRow
            id="ch-tg"
            label="Telegram"
            description="Chat ID 保存在服务端"
            checked={serverDraft.channelTelegram}
            disabled={disabled || !serverDraft.notifyEnabled}
            onChange={(channelTelegram) => onServerPatch({ channelTelegram })}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
              onChange={(event) => onServerPatch({ email: event.target.value })}
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
              placeholder="Bot 名称或备注，勿填写 Bot Token"
              className="h-9"
            />
            <p className="text-[11px] font-bold text-foreground/60">
              <Bot className="mr-1 inline size-3" />
              Bot Token / Resend Key 只放环境变量；邮箱与 Chat ID 在这里保存。
            </p>
          </div>
        </div>
      </section>

      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
          <Bell className="size-4" strokeWidth={2.5} />
          <h2 className="text-base font-black">本机渠道（浏览器）</h2>
        </header>
        <p className="mb-3 text-[11px] font-bold text-foreground/65">
          仅影响当前浏览器的站内铃铛与系统通知，不参与 cron。
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
            description="需授予系统权限"
            checked={localDraft.channelBrowser}
            onChange={(channelBrowser) => onLocalPatch({ channelBrowser })}
          />
        </div>
      </section>
    </>
  );
}
