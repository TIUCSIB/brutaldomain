"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { DomainStoreProvider } from "@/features/domains/domain-store";
import { SettingsStoreProvider } from "@/features/settings/settings-store";

export function ConsoleProviders({ children }: { children: ReactNode }) {
  return (
    <DomainStoreProvider>
      <SettingsStoreProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </SettingsStoreProvider>
    </DomainStoreProvider>
  );
}
