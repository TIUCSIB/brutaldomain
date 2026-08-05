"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NOTIFY_WINDOW_OPTIONS } from "@/features/domains/expiry-alerts";

export function NotificationToolbar({
  notifyDays,
  browserEnabled,
  hasDismissed,
  onSetWindowDays,
  onToggleBrowser,
  onClearDismissed,
}: {
  notifyDays: number;
  browserEnabled: boolean;
  hasDismissed: boolean;
  onSetWindowDays: (days: 7 | 30 | 90) => void;
  onToggleBrowser: () => void;
  onClearDismissed: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-y-2 border-border px-3 py-2">
      {NOTIFY_WINDOW_OPTIONS.map((days) => {
        const active =
          notifyDays === days ||
          (days === 30 && notifyDays > 7 && notifyDays <= 30) ||
          (days === 90 && notifyDays > 30);
        return (
          <Button
            key={days}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            className="h-7 rounded-none px-2 text-[11px]"
            onClick={() => onSetWindowDays(days)}
          >
            {days} 天
          </Button>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant={browserEnabled ? "default" : "outline"}
        className="h-7 rounded-none px-2 text-[11px]"
        onClick={onToggleBrowser}
      >
        浏览器通知
      </Button>
      <Button
        asChild
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 rounded-none px-2 text-[11px]"
      >
        <Link href="/settings">设置</Link>
      </Button>
      {hasDismissed ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto h-7 rounded-none px-2 text-[11px]"
          onClick={onClearDismissed}
        >
          恢复已忽略
        </Button>
      ) : null}
    </div>
  );
}
