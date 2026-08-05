"use client";

import { CalendarClock, RotateCw } from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { Label } from "@/components/ui/label";
import {
  AUTO_RENEW_DAY_OPTIONS,
  type AutomationPrefs,
} from "@/features/settings/automation-prefs";

export function SettingsRenewSection({
  draft,
  onPatch,
}: {
  draft: AutomationPrefs;
  onPatch: (patch: Partial<AutomationPrefs>) => void;
}) {
  return (
    <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
      <header className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
        <RotateCw className="size-4" strokeWidth={2.5} />
        <h2 className="text-base font-black">自动续费</h2>
      </header>
      <div className="space-y-3">
        <AutomationToggleRow
          id="auto-renew"
          label="开启自动续费意向"
          description="到期前自动发起续费（需服务端定时任务；当前仅保存策略）"
          checked={draft.autoRenewEnabled}
          onChange={(autoRenewEnabled) => onPatch({ autoRenewEnabled })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="auto-renew-days" className="text-xs">
              提前天数
            </Label>
            <select
              id="auto-renew-days"
              disabled={!draft.autoRenewEnabled}
              value={draft.autoRenewDays}
              onChange={(event) =>
                onPatch({
                  autoRenewDays: Number(
                    event.target.value,
                  ) as AutomationPrefs["autoRenewDays"],
                })
              }
              className="h-9 w-full rounded-none border-2 border-border bg-background px-2 text-sm font-bold shadow-shadow"
            >
              {AUTO_RENEW_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  剩余 ≤ {days} 天
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="auto-renew-years" className="text-xs">
              每次续费年限
            </Label>
            <select
              id="auto-renew-years"
              disabled={!draft.autoRenewEnabled}
              value={draft.autoRenewYears}
              onChange={(event) =>
                onPatch({
                  autoRenewYears: Number(
                    event.target.value,
                  ) as AutomationPrefs["autoRenewYears"],
                })
              }
              className="h-9 w-full rounded-none border-2 border-border bg-background px-2 text-sm font-bold shadow-shadow"
            >
              <option value={1}>1 年</option>
              <option value={2}>2 年</option>
              <option value={3}>3 年</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-[11px] font-bold text-foreground/65">
              <CalendarClock className="mr-1 inline size-3.5" />
              建议先开「需要确认」
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <AutomationToggleRow
            id="auto-renew-confirm"
            label="续费前需要确认"
            description="即使开启自动续费，也先提示再执行（更安全）"
            checked={draft.autoRenewRequireConfirm}
            disabled={!draft.autoRenewEnabled}
            onChange={(autoRenewRequireConfirm) =>
              onPatch({ autoRenewRequireConfirm })
            }
          />
          <AutomationToggleRow
            id="auto-renew-registered"
            label="仅 Registered 状态"
            description="跳过 Pending / Suspended / Error"
            checked={draft.autoRenewRegisteredOnly}
            disabled={!draft.autoRenewEnabled}
            onChange={(autoRenewRegisteredOnly) =>
              onPatch({ autoRenewRegisteredOnly })
            }
          />
        </div>
      </div>
    </section>
  );
}
