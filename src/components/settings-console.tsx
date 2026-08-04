"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, RefreshCw, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { PageHeader } from "@/components/page-header";
import {
  emptyKeyForm,
  SettingsApiPanel,
} from "@/components/settings-api-panel";
import { SettingsQuotaPanel } from "@/components/settings-quota-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useSettingsStore } from "@/features/settings/settings-store";
import { redirectIfUnauthorized } from "@/lib/api/request-error";
import { formatSyncedAt } from "@/lib/format-relative";

export function SettingsConsole() {
  const {
    keys,
    quota,
    latestSecret,
    loading,
    error,
    initialized,
    lastSyncedAt,
    refreshSettings,
    createApiKey,
    regenerateApiKey,
    deleteApiKey,
  } = useSettingsStore();
  const [keyForm, setKeyForm] = useState(emptyKeyForm);
  const [busyKeyId, setBusyKeyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshSettings({ force: true });
      toast.success("设置数据已同步");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      toast.error("同步失败", {
        description: caught instanceof Error ? caught.message : "未知错误",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreateKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createApiKey({
        key_name: keyForm.key_name,
        ip_whitelist: keyForm.ip_whitelist || undefined,
      });
      setKeyForm(emptyKeyForm);
      toast.success("API Key 已创建");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      toast.error("创建密钥失败", {
        description: caught instanceof Error ? caught.message : "未知错误",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteKey(keyId: number) {
    setBusyKeyId(keyId);
    try {
      await deleteApiKey(keyId);
      toast.success("API Key 已删除");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      toast.error("删除密钥失败", {
        description: caught instanceof Error ? caught.message : "未知错误",
      });
    } finally {
      setBusyKeyId(null);
    }
  }

  async function handleRegenerateKey(keyId: number) {
    setBusyKeyId(keyId);
    try {
      await regenerateApiKey(keyId);
      toast.success("Secret 已重置");
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      toast.error("重置密钥失败", {
        description: caught instanceof Error ? caught.message : "未知错误",
      });
    } finally {
      setBusyKeyId(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <PageHeader
          eyebrow="设置"
          title="DNSHE 工具台"
          description={`API 密钥与配额管理 · ${formatSyncedAt(lastSyncedAt, now)}`}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={refreshing || loading}
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
              同步
            </Button>
          }
        />

        <ConfigErrorBanner error={error} />

        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api">
              <KeyRound className="size-3.5" />
              API 管理
              <span className="border border-current px-1 text-[10px] font-black">
                {keys.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="quota">
              <Wallet className="size-3.5" />
              配额
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api">
            <SettingsApiPanel
              keys={keys}
              latestSecret={latestSecret}
              loading={loading}
              initialized={initialized}
              submitting={submitting}
              busyKeyId={busyKeyId}
              keyForm={keyForm}
              onKeyFormChange={setKeyForm}
              onCreate={handleCreateKey}
              onRegenerate={(keyId) => void handleRegenerateKey(keyId)}
              onDelete={(keyId) => void handleDeleteKey(keyId)}
            />
          </TabsContent>

          <TabsContent value="quota">
            <SettingsQuotaPanel
              quota={quota}
              error={error}
              initialized={initialized}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
