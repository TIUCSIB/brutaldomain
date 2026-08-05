import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  clearNotificationHistory,
  type NotificationHistoryEntry,
} from "@/features/domains/notification-history";

export function NotificationHistoryPanel({
  history,
}: {
  history: NotificationHistoryEntry[];
}) {
  if (history.length === 0) return null;
  return (
    <div className="border-t-2 border-border px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-wide text-foreground/60">
          历史
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 rounded-none px-1.5 text-[10px]"
          onClick={() => clearNotificationHistory()}
        >
          清空
        </Button>
      </div>
      <ul className="max-h-28 space-y-1 overflow-y-auto">
        {history.slice(0, 8).map((item) => (
          <li key={item.id} className="text-[11px] font-bold">
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.title} · {item.body}
              </Link>
            ) : (
              <span>
                {item.title} · {item.body}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
