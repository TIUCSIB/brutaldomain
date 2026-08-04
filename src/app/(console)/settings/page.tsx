import type { Metadata } from "next";

import { SettingsConsole } from "@/components/settings-console";

export const metadata: Metadata = {
  title: "设置",
  description: "DNSHE 密钥与配额管理。",
};

export default function SettingsPage() {
  return <SettingsConsole />;
}
