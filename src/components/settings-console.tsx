"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BellRing, KeyRound, RefreshCw, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { PageHeader } from "@/components/page-header";
import {
  emptyKeyForm,
  SettingsApiPanel,
} from "@/components/settings-api-panel";
import { SettingsAutomationPanel } from "@/components/settings-automation-panel";
import { SettingsQuotaPanel } from "@/components/settings-quota-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useSettingsStore } from "@/features/settings/settings-store";
import { redirectIfUnauthorized } from "@/lib/api/request-error";
import { formatSyncedAt } from "@/lib/format-relative";

type PendingKeyAction =
  | { type: "delete"; keyId: number; name: string }
  | { type: "regenerate"; keyId: number; name: string }
  | null;

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
  const [pendingAction, setPendingAction] = useState<PendingKeyAction>(null);
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

  async function confirmPendingAction() {
    if (!pendingAction) return;
    setBusyKeyId(pendingAction.keyId);
    try {
      if (pendingAction.type === "delete") {
        await deleteApiKey(pendingAction.keyId);
        toast.success("API Key 已删除");
      } else {
        await regenerateApiKey(pendingAction.keyId);
        toast.success("Secret 已重置");
      }
      setPendingAction(null);
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      toast.error(
        pendingAction.type === "delete" ? "删除密钥失败" : "重置密钥失败",
        {
          description: caught instanceof Error ? caught.message : "未知错误",
        },
      );
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
            <TabsTrigger value="automation">
              <BellRing className="size-3.5" />
              通知与续费
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
              onRegenerate={(keyId) => {
                const item = keys.find((key) => key.id === keyId);
                setPendingAction({
                  type: "regenerate",
                  keyId,
                  name: item?.key_name ?? `#${keyId}`,
                });
              }}
              onDelete={(keyId) => {
                const item = keys.find((key) => key.id === keyId);
                setPendingAction({
                  type: "delete",
                  keyId,
                  name: item?.key_name ?? `#${keyId}`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="quota">
            <SettingsQuotaPanel
              quota={quota}
              error={error}
              initialized={initialized}
            />
          </TabsContent>

          <TabsContent value="automation">
            <SettingsAutomationPanel />
          </TabsContent>
        </Tabs>

        <ConfirmActionDialog
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open && busyKeyId === null) setPendingAction(null);
          }}
          title={
            pendingAction?.type === "regenerate"
              ? "确认重置 Secret？"
              : "确认删除 API Key？"
          }
          description={
            pendingAction?.type === "regenerate" ? (
              <>
                重置后旧 Secret 立即失效。密钥{" "}
                <strong className="text-foreground">
                  {pendingAction.name}
                </strong>{" "}
                的新 Secret 仅显示一次。
              </>
            ) : (
              <>
                将永久删除密钥{" "}
                <strong className="text-foreground">
                  {pendingAction?.name}
                </strong>
                ，使用该 Key 的集成会立刻失败。
              </>
            )
          }
          confirmLabel={
            pendingAction?.type === "regenerate" ? "确认重置" : "确认删除"
          }
          pending={busyKeyId !== null}
          pendingLabel={
            pendingAction?.type === "regenerate" ? "重置中…" : "删除中…"
          }
          onConfirm={() => void confirmPendingAction()}
        />
      </div>
    </AppShell>
  );
}
