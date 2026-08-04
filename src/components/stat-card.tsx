import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTone = "blue" | "yellow" | "green" | "pink" | "neutral";

type StatCardIcon = LucideIcon | ReactElement;

export interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: StatCardIcon;
  tone?: StatCardTone;
  compact?: boolean;
  className?: string;
}

const toneStyles: Record<
  StatCardTone,
  { accent: string; icon: string; description: string }
> = {
  blue: {
    accent: "bg-[#1261ff]",
    icon: "bg-[#1261ff] text-white",
    description: "text-blue-800",
  },
  yellow: {
    accent: "bg-[#ffd84d]",
    icon: "bg-[#ffd84d] text-slate-950",
    description: "text-amber-800",
  },
  green: {
    accent: "bg-[#66e58a]",
    icon: "bg-[#66e58a] text-slate-950",
    description: "text-emerald-800",
  },
  pink: {
    accent: "bg-[#ff5c7a]",
    icon: "bg-[#ff5c7a] text-white",
    description: "text-rose-800",
  },
  neutral: {
    accent: "bg-slate-950",
    icon: "bg-slate-950 text-white",
    description: "text-slate-600",
  },
};

function renderIcon(icon: StatCardIcon, compact?: boolean) {
  if (isValidElement(icon)) return icon;

  return createElement(icon, {
    "aria-hidden": true,
    className: compact ? "size-4" : "size-6",
    strokeWidth: 2.5,
  });
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "blue",
  compact = false,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-none border-2 border-slate-950 bg-white py-0 text-slate-950 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",
        compact
          ? "shadow-[3px_3px_0_0_#0f172a]"
          : "shadow-[5px_5px_0_0_#0f172a]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn("w-full", compact ? "h-1.5" : "h-2", styles.accent)}
      />
      <CardContent className={cn(compact ? "p-3.5 sm:p-4" : "p-5 sm:p-6")}>
        <div className={cn("flex items-start justify-between", compact ? "gap-3" : "gap-4")}>
          <div className="min-w-0">
            <h3
              className={cn(
                "font-black uppercase tracking-[0.08em] text-slate-600",
                compact ? "text-[11px]" : "text-sm",
              )}
            >
              {title}
            </h3>
            <div
              className={cn(
                "break-words font-black leading-none tracking-tight",
                compact
                  ? "mt-2 text-2xl sm:text-3xl"
                  : "mt-3 text-3xl sm:text-4xl",
              )}
            >
              {value}
            </div>
          </div>
          {icon ? (
            <div
              aria-hidden="true"
              className={cn(
                "grid shrink-0 place-items-center border-2 border-slate-950",
                compact
                  ? "size-9 shadow-[2px_2px_0_0_#0f172a]"
                  : "size-12 shadow-[3px_3px_0_0_#0f172a]",
                styles.icon,
              )}
            >
              {renderIcon(icon, compact)}
            </div>
          ) : null}
        </div>
        {description ? (
          <div
            className={cn(
              "font-bold leading-5",
              compact ? "mt-2.5 text-xs" : "mt-4 text-sm",
              styles.description,
            )}
          >
            {description}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default StatCard;
