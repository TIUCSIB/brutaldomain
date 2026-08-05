import {
  CirclePlus,
  FilePenLine,
  RefreshCw,
  RotateCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import type { ActivityAction, ActivityEntry } from "@/features/domains/types";

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  emptyDescription?: string;
  emptyTitle?: string;
}

const actionMeta: Record<
  ActivityAction,
  { icon: LucideIcon; label: string; tone: string }
> = {
  "domain.added": {
    icon: CirclePlus,
    label: "已添加域名",
    tone: "bg-[#66e58a]",
  },
  "domain.deleted": {
    icon: Trash2,
    label: "已删除域名",
    tone: "bg-[#ff5c7a] text-white",
  },
  "domain.renewed": {
    icon: RotateCw,
    label: "已续期",
    tone: "bg-[#ffd84d]",
  },
  "domain.refreshed": {
    icon: RefreshCw,
    label: "已刷新状态",
    tone: "bg-blue-200",
  },
  "dns.created": {
    icon: CirclePlus,
    label: "已创建 DNS",
    tone: "bg-[#66e58a]",
  },
  "dns.updated": {
    icon: FilePenLine,
    label: "已更新 DNS",
    tone: "bg-[#ffd84d]",
  },
  "dns.deleted": {
    icon: Trash2,
    label: "已删除 DNS",
    tone: "bg-[#ff5c7a] text-white",
  },
};

export function ActivityTimeline({
  activities,
  emptyDescription = "本会话操作记录会显示在这里。",
  emptyTitle = "暂无动态",
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="border-2 border-dashed border-border bg-secondary-background p-6 text-center">
        <p className="text-base font-black">{emptyTitle}</p>
        <p className="mt-1.5 text-xs font-bold text-foreground/70">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="域名动态"
      className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow"
    >
      <ol className="space-y-0">
        {activities.map((activity, index) => {
          const meta = actionMeta[activity.action];
          const Icon = meta.icon;
          const isLast = index === activities.length - 1;

          return (
            <li
              key={activity.id}
              className="relative grid grid-cols-[36px_1fr] gap-2.5 pb-4 last:pb-0"
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-border"
                />
              ) : null}
              <span
                className={`z-10 grid size-9 place-items-center border-2 border-border shadow-shadow ${meta.tone}`}
              >
                <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h3 className="text-sm font-black">{meta.label}</h3>
                  <time
                    className="font-mono text-[11px] font-bold text-foreground/55"
                    dateTime={activity.created_at.replace(" ", "T")}
                  >
                    {activity.created_at}
                  </time>
                </div>
                <p className="mt-1 break-words text-xs font-bold leading-5 text-foreground/75">
                  {activity.message}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
