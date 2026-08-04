import { Activity } from "lucide-react";

import { PrototypeSection } from "@/components/prototype-section";

export default function ActivityPage() {
  return (
    <PrototypeSection
      eyebrow="Activity / 操作动态"
      title="One timeline for every change."
      description="域名详情页已经展示对应操作记录。全局审计时间线将在后端接口提供操作者、来源与请求结果后接入。"
      icon={<Activity className="size-7" strokeWidth={2.7} aria-hidden="true" />}
      bullets={["Operator identity / 操作者", "API result / 请求结果", "Advanced filters / 高级筛选", "Export audit log / 导出日志"]}
    />
  );
}
