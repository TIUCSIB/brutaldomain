"use client";

import { CalendarClock, RotateCw } from "lucide-react";

import { AutomationToggleRow } from "@/components/settings-automation-toggles";
import { Label } from "@/components/ui/label";
import {
  AUTO_RENEW_DAY_OPTIONS,
  AUTO_RENEW_MAX_DAYS,
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
          description={`剩余 ≤${AUTO_RENEW_MAX_DAYS} 天时才可续费；DNSHE 仅支持直接续费，无年限参数`}
          checked={draft.autoRenewEnabled}
          onChange={(autoRenewEnabled) => onPatch({ autoRenewEnabled })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="auto-renew-days" className="text-xs">
              触发窗口（剩余天数）
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
            <p className="text-[11px] font-bold text-foreground/60">
              <CalendarClock className="mr-1 inline size-3.5" />
              硬性上限 {AUTO_RENEW_MAX_DAYS} 天；接口为单次续费，不选年限
            </p>
          </div>
          <div className="grid gap-2 content-start">
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
      </div>
    </section>
  );
}
