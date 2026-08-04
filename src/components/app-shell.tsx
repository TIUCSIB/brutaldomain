"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export interface AppShellProps {
  children: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function AppShell({
  children,
  searchValue,
  onSearchChange,
}: AppShellProps) {
  return (
    <div className="min-h-svh bg-[#edf4ff] text-slate-950">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 border-2 border-slate-950 bg-[#ffd84d] px-4 py-2 font-black text-slate-950 shadow-[3px_3px_0_0_#0f172a] transition-transform focus:translate-y-0"
      >
        跳到主要内容 Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r-4 border-slate-950 md:block">
        <Sidebar />
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col md:pl-72">
        <Topbar searchValue={searchValue} onSearchChange={onSearchChange} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
