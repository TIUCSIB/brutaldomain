import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard-client";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "域名资产总览、到期风险与服务商管理。",
};

export default function DashboardPage() {
  return (
    <>
      <DashboardClient />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
