"use client";

import { useState } from "react";
import { Info, Save } from "lucide-react";

import { SettingsNotifySection } from "@/components/settings-notify-section";
import { SettingsNotifyTestPanel } from "@/components/settings-notify-test-panel";
import { SettingsRenewSection } from "@/components/settings-renew-section";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  type AutomationPrefs,
  validateAutomationPrefs,
} from "@/features/settings/automation-prefs";
import { useAutomationPrefs } from "@/features/settings/use-automation-prefs";
import {
  disableBrowserNotify,
  enableBrowserNotify,
} from "@/features/domains/use-browser-notify";

export function SettingsAutomationPanel() {
  const { prefs, setPrefs } = useAutomationPrefs();
  const [draft, setDraft] = useState<AutomationPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const view = draft ?? prefs;

  function patch(partial: Partial<AutomationPrefs>) {
    setDraft((current) => ({ ...(current ?? prefs), ...partial }));
  }

  async function handleSave() {
    const next = { ...view };
    const errors = validateAutomationPrefs(next);
    if (errors.length > 0) {
      toast.error("无法保存", { description: errors[0] });
      return;
    }

    setSaving(true);
    try {
      if (next.notifyEnabled && next.channelBrowser) {
        const permission = await enableBrowserNotify();
        if (permission === "denied") {
          toast.error("浏览器通知权限被拒绝", {
            description: "已关闭浏览器渠道，其他设置仍会保存",
          });
          next.channelBrowser = false;
        } else if (permission === "unsupported") {
          toast.error("当前环境不支持浏览器通知");
          next.channelBrowser = false;
        }
      } else {
        disableBrowserNotify();
      }

      setPrefs(next);
      setDraft(null);
      toast.success("通知与续费偏好已保存", {
        description:
          next.channelEmail || next.channelTelegram
            ? "邮件/TG 渠道配置已记录；实际推送需服务端接入后生效"
            : "站内与浏览器偏好已生效",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="border-2 border-border bg-[#fff7d6] p-3 shadow-shadow">
        <p className="flex items-start gap-2 text-xs font-bold leading-5 text-foreground/80">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          偏好保存在本机浏览器。站内/浏览器通知立即生效。邮件与 Telegram
          通过服务端发送（可下方测试）；定时扫描用 CRON_SECRET 调
          /api/cron/expiry-notify。自动续费仍为策略偏好，不会自动扣费执行。
        </p>
      </section>

      <SettingsNotifySection draft={view} onPatch={patch} />
      <SettingsNotifyTestPanel draft={view} />
      <SettingsRenewSection draft={view} onPatch={patch} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-foreground/60">
          当前草稿：通知{" "}
          {view.notifyEnabled ? `${view.notifyDays} 天` : "关"}
          {" · "}
          自动续费 {view.autoRenewEnabled ? `${view.autoRenewDays} 天` : "关"}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          <Save className="size-3.5" />
          {saving ? "保存中…" : "保存设置"}
        </Button>
      </div>
    </div>
  );
}
