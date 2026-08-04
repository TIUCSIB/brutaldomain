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
    label: "Domain added / 已添加",
    tone: "bg-[#66e58a]",
  },
  "domain.deleted": {
    icon: Trash2,
    label: "Domain deleted / 已删除",
    tone: "bg-[#ff5c7a] text-white",
  },
  "domain.renewed": {
    icon: RotateCw,
    label: "Domain renewed / 已续期",
    tone: "bg-[#ffd84d]",
  },
  "domain.refreshed": {
    icon: RefreshCw,
    label: "Status refreshed / 已刷新",
    tone: "bg-blue-200",
  },
  "dns.created": {
    icon: CirclePlus,
    label: "DNS created / 已创建",
    tone: "bg-[#66e58a]",
  },
  "dns.updated": {
    icon: FilePenLine,
    label: "DNS updated / 已更新",
    tone: "bg-[#ffd84d]",
  },
  "dns.deleted": {
    icon: Trash2,
    label: "DNS deleted / 已删除",
    tone: "bg-[#ff5c7a] text-white",
  },
  "demo.reset": {
    icon: RefreshCw,
    label: "Demo reset / 已重置",
    tone: "bg-slate-200",
  },
};

export function ActivityTimeline({
  activities,
  emptyDescription = "Changes to this domain will appear here.",
  emptyTitle = "No activity yet / 暂无动态",
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-950 bg-white p-10 text-center">
        <p className="text-lg font-black">{emptyTitle}</p>
        <p className="mt-2 text-sm font-bold text-slate-600">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <section
      aria-label="域名动态 Activity timeline"
      className="border-2 border-slate-950 bg-white p-5 shadow-[5px_5px_0_0_#0f172a] sm:p-6"
    >
      <ol className="space-y-0">
        {activities.map((activity, index) => {
          const meta = actionMeta[activity.action];
          const Icon = meta.icon;
          const isLast = index === activities.length - 1;

          return (
            <li
              key={activity.id}
              className="relative grid grid-cols-[44px_1fr] gap-4 pb-7 last:pb-0"
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 bg-slate-950"
                />
              ) : null}
              <span
                className={`z-10 grid size-11 place-items-center border-2 border-slate-950 shadow-[2px_2px_0_0_#0f172a] ${meta.tone}`}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-black">{meta.label}</h3>
                  <time
                    className="font-mono text-xs font-bold text-slate-500"
                    dateTime={activity.created_at.replace(" ", "T")}
                  >
                    {activity.created_at}
                  </time>
                </div>
                <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-700">
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
