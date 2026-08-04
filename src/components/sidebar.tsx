"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CircleDotDashed,
  Globe2,
  LayoutDashboard,
  Settings,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavigationItem = {
  label: string;
  labelZh: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { label: "Overview", labelZh: "概览", href: "/dashboard", icon: LayoutDashboard },
  { label: "Domains", labelZh: "域名", href: "/domains", icon: Globe2 },
  {
    label: "DNS Records",
    labelZh: "解析记录",
    href: "/dns-records",
    icon: Waypoints,
  },
  { label: "Activity", labelZh: "动态", href: "/activity", icon: Activity },
  { label: "Settings", labelZh: "设置", href: "/settings", icon: Settings },
];

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-[#1261ff] text-white ${className}`}
    >
      <div className="flex h-20 shrink-0 items-center gap-3 border-b-4 border-slate-950 px-5">
        <div
          aria-hidden="true"
          className="grid size-10 place-items-center border-2 border-slate-950 bg-[#ffd84d] text-slate-950 shadow-[3px_3px_0_0_#0f172a]"
        >
          <CircleDotDashed className="size-6" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <p className="text-lg font-black tracking-tight">DOMAIN</p>
          <p className="mt-1 text-xs font-bold text-blue-100">域名控制台</p>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <nav
          aria-label="主导航 Main navigation"
          className="flex-1 space-y-2 overflow-y-auto p-4"
        >
          <p className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">
            Workspace / 工作台
          </p>
          {navigation.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`group flex min-h-12 items-center gap-3 border-2 border-slate-950 px-3 py-2.5 text-sm font-black transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd84d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1261ff] active:translate-x-0.5 active:translate-y-0.5 ${
                      active
                        ? "translate-x-[-2px] translate-y-[-2px] bg-white text-slate-950 shadow-[4px_4px_0_0_#0f172a]"
                        : "border-transparent text-white hover:border-slate-950 hover:bg-[#4b83ff] hover:shadow-[3px_3px_0_0_#0f172a]"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={2.5} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span
                      className={`text-xs ${active ? "text-blue-700" : "text-blue-100"}`}
                    >
                      {item.labelZh}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="md:hidden">
                  {item.label} · {item.labelZh}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      <div className="shrink-0 border-t-4 border-slate-950 p-4">
        <div className="border-2 border-slate-950 bg-[#0b46c4] p-3 shadow-[3px_3px_0_0_#0f172a]">
          <p className="text-xs font-black uppercase tracking-wider">System status</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-100">
            <span className="size-2.5 rounded-full border border-slate-950 bg-[#66e58a]" />
            All systems normal / 运行正常
          </p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
