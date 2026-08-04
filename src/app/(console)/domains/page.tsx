import type { Metadata } from "next";

import { DomainsClient } from "@/components/domains-client";

export const metadata: Metadata = {
  title: "域名",
  description: "查看并管理全部 DNSHE 域名资产。",
};

export default function DomainsPage() {
  return <DomainsClient />;
}
