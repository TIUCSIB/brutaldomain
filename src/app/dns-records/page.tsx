import { Waypoints } from "lucide-react";

import { PrototypeSection } from "@/components/prototype-section";

export default function DnsRecordsPage() {
  return (
    <PrototypeSection
      eyebrow="DNS Records / 解析记录"
      title="Global DNS workspace is next."
      description="当前原型已在每个域名详情页提供完整 DNS CRUD。全局视图将在真实 API 接入后聚合所有 zone 记录。"
      icon={<Waypoints className="size-7" strokeWidth={2.7} aria-hidden="true" />}
      bullets={["Cross-zone search / 跨域搜索", "Bulk edits / 批量修改", "Conflict detection / 冲突检测", "Cloudflare sync / 状态同步"]}
    />
  );
}
