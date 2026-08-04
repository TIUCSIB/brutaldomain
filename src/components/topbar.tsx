"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Code2,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TopbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function Topbar({ searchValue, onSearchChange }: TopbarProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex min-h-20 items-center gap-3 border-b-4 border-slate-950 bg-[#edf4ff]/95 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="打开主导航 Open main navigation"
            className="size-11 shrink-0 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[3px_3px_0_0_#0f172a] hover:bg-[#ffd84d] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden"
          >
            <Menu className="size-5" strokeWidth={3} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(88vw,320px)] border-r-4 border-slate-950 bg-[#1261ff] p-0 [&>button]:z-10 [&>button]:border-2 [&>button]:border-slate-950 [&>button]:bg-white [&>button]:p-1 [&>button]:text-slate-950 [&>button]:opacity-100"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>主导航 Main navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative min-w-0 max-w-xl flex-1" role="search">
        <label htmlFor="app-shell-search" className="sr-only">
          搜索域名和记录 Search domains and records
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-blue-700"
          strokeWidth={2.5}
        />
        <input
          id="app-shell-search"
          type="search"
          autoComplete="off"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索域名、DNS… / Search"
          className="h-11 w-full rounded-none border-2 border-slate-950 bg-white pl-10 pr-3 text-sm font-bold text-slate-950 shadow-[3px_3px_0_0_#0f172a] outline-none placeholder:text-slate-500 focus-visible:ring-4 focus-visible:ring-blue-300"
        />
      </div>

      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="通知 Notifications，2 条未读"
              className="relative size-11 shrink-0 rounded-none border-2 border-slate-950 bg-white text-slate-950 shadow-[3px_3px_0_0_#0f172a] hover:bg-[#ffd84d] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Bell className="size-5" strokeWidth={2.5} />
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-slate-950 bg-[#ff5c7a] text-[10px] font-black text-white"
              >
                2
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications / 通知</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label="打开 GitHub demo 用户菜单"
            className="h-11 shrink-0 gap-2 rounded-none border-2 border-slate-950 bg-[#1261ff] px-2 text-white shadow-[3px_3px_0_0_#0f172a] hover:bg-[#0b46c4] hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:px-3"
          >
            <span className="grid size-7 place-items-center border-2 border-slate-950 bg-[#ffd84d] text-slate-950">
              <Code2 className="size-4" strokeWidth={2.5} />
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-xs font-black">demo</span>
              <span className="block text-[10px] font-bold text-blue-100">GitHub user</span>
            </span>
            <ChevronDown className="hidden size-4 sm:block" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-none border-2 border-slate-950 bg-white p-1 text-slate-950 shadow-[4px_4px_0_0_#0f172a]"
        >
          <DropdownMenuLabel className="font-black">
            demo
            <span className="block text-xs font-medium text-slate-500">
              demo@github.local
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-950" />
          <DropdownMenuItem className="rounded-none font-bold focus:bg-blue-100">
            <UserRound className="size-4" />
            Profile / 个人资料
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-none font-bold focus:bg-blue-100">
            <Settings className="size-4" />
            Settings / 设置
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-950" />
          <DropdownMenuItem className="rounded-none font-bold text-red-700 focus:bg-red-100 focus:text-red-800">
            <LogOut className="size-4" />
            Sign out / 退出
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default Topbar;
