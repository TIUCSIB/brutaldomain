import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export type StatCardTone = "blue" | "yellow" | "green" | "pink" | "neutral";

type StatCardIcon = LucideIcon | ReactElement;

export interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: StatCardIcon;
  tone?: StatCardTone;
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

function renderIcon(icon: StatCardIcon) {
  if (isValidElement(icon)) return icon;

  return createElement(icon, {
    "aria-hidden": true,
    className: "size-6",
    strokeWidth: 2.5,
  });
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "blue",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className="group relative overflow-hidden rounded-none border-2 border-slate-950 bg-white py-0 text-slate-950 shadow-[5px_5px_0_0_#0f172a] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <div aria-hidden="true" className={`h-2 w-full ${styles.accent}`} />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-slate-600">
              {title}
            </h3>
            <div className="mt-3 break-words text-3xl font-black leading-none tracking-tight sm:text-4xl">
              {value}
            </div>
          </div>
          {icon ? (
            <div
              aria-hidden="true"
              className={`grid size-12 shrink-0 place-items-center border-2 border-slate-950 shadow-[3px_3px_0_0_#0f172a] ${styles.icon}`}
            >
              {renderIcon(icon)}
            </div>
          ) : null}
        </div>
        {description ? (
          <div className={`mt-4 text-sm font-bold leading-5 ${styles.description}`}>
            {description}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default StatCard;
