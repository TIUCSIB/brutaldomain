"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Save } from "lucide-react";

import { SettingsNotifySection } from "@/components/settings-notify-section";
import { SettingsNotifyTestPanel } from "@/components/settings-notify-test-panel";
import { SettingsRenewSection } from "@/components/settings-renew-section";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { AutomationPrefs } from "@/features/settings/automation-prefs";
import {
  normalizeServerNotifyPrefs,
  validateServerNotifyPrefs,
  type ServerNotifyPrefs,
} from "@/features/settings/server-notify-prefs";
import { useAutomationPrefs } from "@/features/settings/use-automation-prefs";
import { useServerNotifyPrefs } from "@/features/settings/use-server-notify-prefs";
import {
  disableBrowserNotify,
  enableBrowserNotify,
} from "@/features/domains/use-browser-notify";

function toLocalNotifyDays(
  days: number,
): AutomationPrefs["notifyDays"] {
  if (days <= 1) return 1;
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  if (days <= 14) return 14;
  if (days <= 30) return 30;
  if (days <= 60) return 60;
  return 90;
}

export function SettingsAutomationPanel() {
  const { prefs: localPrefs, setPrefs: setLocalPrefs } = useAutomationPrefs();
  const {
    prefs: serverPrefs,
    secrets,
    loading: serverLoading,
    loaded: serverLoaded,
    error: serverError,
    save: saveServer,
    refresh,
  } = useServerNotifyPrefs();

  const [localDraft, setLocalDraft] = useState<Partial<AutomationPrefs>>({});
  const [serverDraft, setServerDraft] = useState<Partial<ServerNotifyPrefs>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void refresh();
  }, [refresh]);

  const localView: AutomationPrefs = { ...localPrefs, ...localDraft };
  const serverView = normalizeServerNotifyPrefs({
    ...serverPrefs,
    ...serverDraft,
  });

  function patchLocal(partial: Partial<AutomationPrefs>) {
    setLocalDraft((current) => ({ ...current, ...partial }));
  }

  function patchServer(partial: Partial<ServerNotifyPrefs>) {
    setServerDraft((current) => ({ ...current, ...partial }));
  }

  async function handleSave() {
    const nextLocal: AutomationPrefs = { ...localView };
    const nextServer = normalizeServerNotifyPrefs(serverView);

    const serverErrors = validateServerNotifyPrefs(nextServer);
    if (serverErrors.length > 0) {
      toast.error("无法保存服务端通知配置", {
        description: serverErrors[0],
      });
      return;
    }

    setSaving(true);
    try {
      if (nextLocal.channelBrowser) {
        const permission = await enableBrowserNotify();
        if (permission === "denied" || permission === "unsupported") {
          toast.error(
            permission === "denied"
              ? "浏览器通知权限被拒绝"
              : "当前环境不支持浏览器通知",
          );
          nextLocal.channelBrowser = false;
        }
      } else {
        disableBrowserNotify();
      }

      // Align in-app window with server window
      nextLocal.notifyDays = toLocalNotifyDays(nextServer.notifyDays);
      nextLocal.notifyEnabled = true;
      nextLocal.notifyExpired = nextServer.notifyExpired;
      // Remote targets live on server only
      nextLocal.channelEmail = false;
      nextLocal.channelTelegram = false;
      nextLocal.email = "";
      nextLocal.telegramChatId = "";
      nextLocal.telegramHint = "";

      setLocalPrefs(nextLocal);
      setLocalDraft({});

      const saved = await saveServer(nextServer);
      setServerDraft({});

      toast.success("已保存", {
        description: saved.persistedToDisk
          ? "服务端通知配置已落盘；本机渠道已更新"
          : saved.warning || "服务端配置已写入（可能仅内存）",
      });
    } catch (error) {
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : "未知错误",
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
          <span>
            <strong>服务端配置</strong>
            （天数、邮箱、Chat ID、远程渠道）保存后供 cron/测试使用。
            <strong> 密钥</strong>
            （Resend / Bot Token / Cron）只在环境变量。
            <strong> 本机渠道</strong>
            与自动续费策略仅存当前浏览器。
            {serverError ? (
              <>
                <br />
                加载服务端配置失败：{serverError}{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void refresh()}
                >
                  重试
                </button>
              </>
            ) : null}
          </span>
        </p>
      </section>

      <SettingsNotifySection
        serverDraft={serverView}
        onServerPatch={patchServer}
        localDraft={localView}
        onLocalPatch={patchLocal}
        serverLoading={serverLoading && !serverLoaded}
      />
      <SettingsNotifyTestPanel draft={serverView} secrets={secrets} />
      <SettingsRenewSection draft={localView} onPatch={patchLocal} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-foreground/60">
          服务端通知{" "}
          {serverView.notifyEnabled ? `${serverView.notifyDays} 天` : "关"}
          {" · "}
          自动续费{" "}
          {localView.autoRenewEnabled ? `${localView.autoRenewDays} 天` : "关"}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={saving || (serverLoading && !serverLoaded)}
          onClick={() => void handleSave()}
        >
          <Save className="size-3.5" />
          {saving ? "保存中…" : "保存全部"}
        </Button>
      </div>
    </div>
  );
}
