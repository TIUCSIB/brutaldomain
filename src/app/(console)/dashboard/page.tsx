import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard-client";

export const metadata: Metadata = {
  title: "控制台",
  description: "域名资产总览、到期风险与服务商管理。",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
