import { AlertTriangle } from "lucide-react";

import { isDnsheNotConfiguredMessage } from "@/lib/api/dnshe-config-error";

interface ConfigErrorBannerProps {
  error: string | null;
}

export function ConfigErrorBanner({ error }: ConfigErrorBannerProps) {
  if (!error) return null;

  const isConfigError = isDnsheNotConfiguredMessage(error);

  return (
    <section
      role="alert"
      className="border-4 border-slate-950 bg-[#fff0f3] p-4 shadow-[4px_4px_0_0_#ff5c7a] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center border-2 border-slate-950 bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_#0f172a]">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
            {isConfigError ? "DNSHE 未配置" : "数据加载失败"}
          </p>
          <h2 className="mt-1 text-xl font-black">
            {isConfigError
              ? "真实数据源尚未配置"
              : "无法加载 DNSHE 数据"}
          </h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{error}</p>
          {isConfigError ? (
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              请在本地 <code>.env.local</code> 或 Vercel 环境变量中设置
              <code className="mx-1">DNSHE_API_KEY</code> 与
              <code className="mx-1">DNSHE_API_SECRET</code>，然后重新部署或重启开发服务。
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
