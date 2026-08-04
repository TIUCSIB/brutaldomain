import { Radar, Shield, Wallet } from "lucide-react";

import type { SettingsQuota } from "@/features/settings/types";

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | number;
  hint: string;
  tone: "yellow" | "blue" | "green";
}) {
  const toneClass =
    tone === "yellow"
      ? "bg-[#ffd84d]"
      : tone === "blue"
        ? "bg-main/15"
        : "bg-green-100";

  return (
    <div className="border-2 border-border bg-secondary-background p-3 shadow-shadow">
      <div className="flex items-center gap-2.5">
        <span
          className={`grid size-9 place-items-center border-2 border-border ${toneClass}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-foreground/55">
            {label}
          </p>
          <p className="text-xl font-black leading-none">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-foreground/70">{hint}</p>
    </div>
  );
}

export interface SettingsQuotaPanelProps {
  quota: SettingsQuota | null;
  error: string | null;
  initialized: boolean;
}

export function SettingsQuotaPanel({
  quota,
  error,
  initialized,
}: SettingsQuotaPanelProps) {
  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={Wallet}
          label="可用"
          value={quota ? quota.available : "—"}
          hint={!initialized ? "加载中…" : "当前可用配额"}
          tone="yellow"
        />
        <MetricCard
          icon={Radar}
          label="已用"
          value={quota ? quota.used : "—"}
          hint={!initialized ? "加载中…" : "已消耗配额"}
          tone="green"
        />
        <MetricCard
          icon={Shield}
          label="总计"
          value={quota ? quota.total : "—"}
          hint={!initialized ? "加载中…" : "基础 + 邀请奖励"}
          tone="blue"
        />
      </section>

      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <h2 className="text-lg font-black">配额明细</h2>
        {quota ? (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["已用", quota.used],
                ["基础配额", quota.base],
                ["邀请奖励", quota.invite_bonus],
                ["总计", quota.total],
                ["可用", quota.available],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-2 border-border bg-main/5 px-3 py-2"
              >
                <dt className="text-xs font-black text-foreground/70">
                  {label}
                </dt>
                <dd className="text-sm font-black">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-xs font-bold text-foreground/70">
            {error ? "暂不可用" : "加载中…"}
          </p>
        )}
      </section>
    </div>
  );
}
