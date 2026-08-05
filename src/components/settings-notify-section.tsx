"use client";

import { Bell, Bot, Mail } from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EXPIRY_NOTIFY_DAY_OPTIONS,
  type AutomationPrefs,
} from "@/features/settings/automation-prefs";

export function SettingsNotifySection({
  draft,
  onPatch,
}: {
  draft: AutomationPrefs;
  onPatch: (patch: Partial<AutomationPrefs>) => void;
}) {
  return (
    <>
      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
          <Bell className="size-4" strokeWidth={2.5} />
          <h2 className="text-base font-black">到期通知</h2>
        </header>
        <div className="space-y-3">
          <AutomationToggleRow
            id="notify-enabled"
            label="启用到期通知"
            description="关闭后不再按到期窗口提醒（仍可手动查看列表）"
            checked={draft.notifyEnabled}
            onChange={(notifyEnabled) => onPatch({ notifyEnabled })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="notify-days" className="text-xs">
                提前多少天开始通知
              </Label>
              <select
                id="notify-days"
                disabled={!draft.notifyEnabled}
                value={draft.notifyDays}
                onChange={(event) =>
                  onPatch({
                    notifyDays: Number(
                      event.target.value,
                    ) as AutomationPrefs["notifyDays"],
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
              checked={draft.notifyExpired}
              disabled={!draft.notifyEnabled}
              onChange={(notifyExpired) => onPatch({ notifyExpired })}
            />
          </div>
        </div>
      </section>

      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
          <Mail className="size-4" strokeWidth={2.5} />
          <h2 className="text-base font-black">通知渠道</h2>
        </header>
        <div className="grid gap-2 sm:grid-cols-2">
          <AutomationToggleRow
            id="ch-inapp"
            label="站内通知"
            description="顶部通知中心"
            checked={draft.channelInApp}
            disabled={!draft.notifyEnabled}
            onChange={(channelInApp) => onPatch({ channelInApp })}
          />
          <AutomationToggleRow
            id="ch-browser"
            label="浏览器通知"
            description="需授予系统权限"
            checked={draft.channelBrowser}
            disabled={!draft.notifyEnabled}
            onChange={(channelBrowser) => onPatch({ channelBrowser })}
          />
          <AutomationToggleRow
            id="ch-email"
            label="Email"
            description="Resend 服务端发送，可点下方测试"
            checked={draft.channelEmail}
            disabled={!draft.notifyEnabled}
            onChange={(channelEmail) => onPatch({ channelEmail })}
          />
          <AutomationToggleRow
            id="ch-tg"
            label="Telegram"
            description="Bot Token 在服务端，Chat ID 在此填写"
            checked={draft.channelTelegram}
            disabled={!draft.notifyEnabled}
            onChange={(channelTelegram) => onPatch({ channelTelegram })}
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
              disabled={!draft.notifyEnabled || !draft.channelEmail}
              value={draft.email}
              onChange={(event) => onPatch({ email: event.target.value })}
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
              disabled={!draft.notifyEnabled || !draft.channelTelegram}
              value={draft.telegramChatId}
              onChange={(event) =>
                onPatch({ telegramChatId: event.target.value })
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
              disabled={!draft.notifyEnabled || !draft.channelTelegram}
              value={draft.telegramHint}
              onChange={(event) =>
                onPatch({ telegramHint: event.target.value })
              }
              placeholder="Bot 名称或备注，勿填写 Bot Token"
              className="h-9"
            />
            <p className="text-[11px] font-bold text-foreground/60">
              <Bot className="mr-1 inline size-3" />
              Bot Token 只能放在服务端环境变量，不要写在浏览器里。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
