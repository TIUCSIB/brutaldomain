"use client";

import type { FormEvent } from "react";

import { SensitiveValue } from "@/components/sensitive-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  SettingsApiKey,
  SettingsKeySecretResponse,
} from "@/features/settings/types";
import { cn } from "@/lib/utils";

export const emptyKeyForm = { ip_whitelist: "", key_name: "" };

export interface SettingsApiPanelProps {
  keys: SettingsApiKey[];
  latestSecret: SettingsKeySecretResponse | null;
  loading: boolean;
  initialized: boolean;
  submitting: boolean;
  busyKeyId: number | null;
  keyForm: typeof emptyKeyForm;
  onKeyFormChange: (value: typeof emptyKeyForm) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onRegenerate: (keyId: number) => void;
  onDelete: (keyId: number) => void;
}

function isActiveStatus(status: string) {
  return status.trim().toLowerCase() === "active";
}

function StatusCell({ status }: { status: string }) {
  const active = isActiveStatus(status);

  return (
    <span className="inline-flex items-center gap-1.5 font-bold">
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          active ? "animate-pulse bg-[#66e58a]" : "bg-foreground/30",
        )}
        aria-hidden
      />
      <span className="sr-only">{status}</span>
      {active ? null : (
        <span className="text-foreground/70">{status}</span>
      )}
    </span>
  );
}

export function SettingsApiPanel({
  keys,
  latestSecret,
  loading,
  initialized,
  submitting,
  busyKeyId,
  keyForm,
  onKeyFormChange,
  onCreate,
  onRegenerate,
  onDelete,
}: SettingsApiPanelProps) {
  return (
    <div className="space-y-3">
      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">创建密钥</h2>
            <p className="mt-0.5 text-xs font-bold text-foreground/70">
              通过 DNSHE keys 接口创建，Secret 仅显示一次
            </p>
          </div>
          <span className="border-2 border-border bg-main/10 px-2 py-1 text-[11px] font-black">
            {keys.length} 个密钥
          </span>
        </div>

        <form onSubmit={onCreate} className="grid gap-2.5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="key-name" className="text-xs">
              密钥名称
            </Label>
            <Input
              id="key-name"
              required
              value={keyForm.key_name}
              onChange={(event) =>
                onKeyFormChange({
                  ...keyForm,
                  key_name: event.target.value,
                })
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="key-ip" className="text-xs">
              IP 白名单
            </Label>
            <Input
              id="key-ip"
              value={keyForm.ip_whitelist}
              onChange={(event) =>
                onKeyFormChange({
                  ...keyForm,
                  ip_whitelist: event.target.value,
                })
              }
              placeholder="可选"
              className="h-9"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting || loading}>
              {submitting ? "创建中…" : "创建密钥"}
            </Button>
          </div>
        </form>

        {latestSecret ? (
          <div className="mt-3 space-y-2 border-2 border-border bg-[#fff7d6] p-3 text-xs font-bold">
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0">API Key:</span>
              <SensitiveValue
                value={latestSecret.api_key}
                kind="key"
                copyLabel="API Key 已复制"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0">API Secret:</span>
              <SensitiveValue
                value={latestSecret.api_secret}
                kind="secret"
                copyLabel="API Secret 已复制"
              />
            </div>
            <p className="text-foreground/70">
              {latestSecret.warning || "Secret 仅显示一次，请立即保存。"}
            </p>
          </div>
        ) : null}
      </section>

      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <h2 className="text-lg font-black">密钥列表</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="px-2.5 py-1.5">名称</th>
                <th className="px-2.5 py-1.5">密钥</th>
                <th className="px-2.5 py-1.5">状态</th>
                <th className="px-2.5 py-1.5">请求数</th>
                <th className="px-2.5 py-1.5">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((item) => (
                <tr key={item.id} className="border-t-2 border-border">
                  <td className="px-2.5 py-2 font-black">{item.key_name}</td>
                  <td className="px-2.5 py-2">
                    <SensitiveValue
                      value={item.api_key}
                      kind="key"
                      copyLabel="密钥已复制"
                    />
                  </td>
                  <td className="px-2.5 py-2">
                    <StatusCell status={item.status} />
                  </td>
                  <td className="px-2.5 py-2 font-bold">
                    {item.request_count}
                  </td>
                  <td className="px-2.5 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyKeyId === item.id || loading}
                        onClick={() => onRegenerate(item.id)}
                      >
                        重置
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyKeyId === item.id || loading}
                        onClick={() => onDelete(item.id)}
                        className="bg-[#ff5c7a] text-white hover:bg-red-600"
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialized && !loading && keys.length === 0 ? (
                <tr className="border-t-2 border-border">
                  <td
                    colSpan={5}
                    className="px-2.5 py-4 text-center font-bold text-foreground/60"
                  >
                    暂无密钥
                  </td>
                </tr>
              ) : null}
              {!initialized ? (
                <tr className="border-t-2 border-border">
                  <td
                    colSpan={5}
                    className="px-2.5 py-4 text-center font-bold text-foreground/60"
                  >
                    加载中…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
