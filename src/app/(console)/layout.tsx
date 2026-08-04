import type { ReactNode } from "react";

import { ConsoleProviders } from "@/components/console-providers";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
