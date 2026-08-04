"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const SIDEBAR_STORAGE_KEY = "brutaldomain.sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "brutaldomain:sidebar-collapsed";

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function getSidebarCollapsedSnapshot() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );

  const handleSidebarCollapsedChange = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }, []);

  return (
    <div className="min-h-svh bg-[#edf4ff] text-slate-950">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 border-2 border-border bg-[#ffd84d] px-4 py-2 font-black text-foreground shadow-shadow transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden border-r-4 border-border transition-[width] duration-200 md:block ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-72"
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      <div
        className={`flex min-h-svh min-w-0 flex-col transition-[padding] duration-200 ${
          sidebarCollapsed ? "md:pl-[4.5rem]" : "md:pl-72"
        }`}
      >
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapsedChange={handleSidebarCollapsedChange}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-3 outline-none sm:p-4 lg:p-5"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
