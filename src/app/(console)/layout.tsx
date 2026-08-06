import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ConsoleProviders } from "@/components/console-providers";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <ConsoleProviders>
      <AppShell>{children}</AppShell>
    </ConsoleProviders>
  );
}
