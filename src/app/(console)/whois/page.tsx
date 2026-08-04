import type { Metadata } from "next";

import { WhoisConsole } from "@/components/whois-console";

export const metadata: Metadata = {
  title: "WHOIS 查询",
  description: "查询域名注册状态、到期时间与名称服务器。",
};

export default function WhoisPage() {
  return <WhoisConsole />;
}
