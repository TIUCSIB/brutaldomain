import type { Metadata } from "next";

import { GlobalDnsConsole } from "@/components/global-dns-console";

export const metadata: Metadata = {
  title: "全局 DNS",
  description: "跨域名搜索与浏览 DNS 解析记录。",
};

export default function GlobalDnsPage() {
  return <GlobalDnsConsole />;
}
