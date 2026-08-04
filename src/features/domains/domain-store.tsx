"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useDomainStoreController } from "./use-domain-store-controller";
import type { DomainStoreValue } from "./types";

const DomainStoreContext = createContext<DomainStoreValue | null>(null);

export interface DomainStoreProviderProps {
  children: ReactNode;
}

export function DomainStoreProvider({ children }: DomainStoreProviderProps) {
  const value = useDomainStoreController();
  return (
    <DomainStoreContext.Provider value={value}>{children}</DomainStoreContext.Provider>
  );
}

export function useDomainStore(): DomainStoreValue {
  const context = useContext(DomainStoreContext);
  if (!context) {
    throw new Error("useDomainStore must be used inside DomainStoreProvider");
  }
  return context;
}
