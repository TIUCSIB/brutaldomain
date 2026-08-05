"use client";

import { BookOpen, Copy, Server, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { copyText } from "@/lib/clipboard";

const ENV_SNIPPET = `# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_SECRET=
# optional: biscuit,another-user
GITHUB_ALLOWED_USERS=

# DNSHE
DNSHE_API_BASE_URL=https://api005.dnshe.com/index.php
DNSHE_API_KEY=
DNSHE_API_SECRET=`;

const CHECKLIST = [
  {
    icon: Shield,
    title: "GitHub OAuth",
    body: "Callback 必须是 {站点}/api/auth/callback；AUTH_SECRET 用随机长串。",
  },
  {
    icon: Server,
    title: "DNSHE 凭据",
    body: "API Key/Secret 仅服务端读取，不要加 NEXT_PUBLIC_ 前缀。",
  },
  {
    icon: BookOpen,
    title: "部署后自检",
    body: "登录 → Dashboard 能拉域名 → 设置页能看配额/密钥 → WHOIS 可查询。",
  },
] as const;

export function SettingsHelpPanel() {
  async function handleCopyEnv() {
    const ok = await copyText(ENV_SNIPPET);
    if (ok) toast.success("已复制 .env 模板");
    else toast.error("复制失败");
  }

  return (
    <div className="space-y-3">
      <section className="border-2 border-border bg-secondary-background p-3.5 shadow-shadow">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">部署与环境变量</h2>
            <p className="mt-0.5 text-xs font-bold text-foreground/70">
              未配置时 API 返回 503，不会回退本地假数据
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopyEnv()}
          >
            <Copy className="size-3.5" />
            复制模板
          </Button>
        </div>

        <pre className="overflow-x-auto border-2 border-border bg-main/5 p-3 text-[11px] font-bold leading-relaxed">
          {ENV_SNIPPET}
        </pre>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        {CHECKLIST.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="border-2 border-border bg-secondary-background p-3 shadow-shadow"
            >
              <p className="inline-flex items-center gap-1.5 text-sm font-black">
                <Icon className="size-4 text-main" aria-hidden />
                {item.title}
              </p>
              <p className="mt-1.5 text-xs font-bold text-foreground/70">
                {item.body}
              </p>
            </div>
          );
        })}
      </section>

      <section className="border-2 border-border bg-[#fff7d6] p-3.5 shadow-shadow">
        <h2 className="text-base font-black">密钥安全提示</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold text-foreground/80">
          <li>Secret 创建/重置后只显示一次，请立刻复制保存。</li>
          <li>
            列表中的 Key 默认脱敏，形如{" "}
            <code className="border border-border bg-secondary-background px-1">
              cfsd_500******53e4
            </code>
            。
          </li>
          <li>不要把真实 Key/Secret 写进 README、Issue 或客户端 Bundle。</li>
        </ul>
      </section>
    </div>
  );
}
