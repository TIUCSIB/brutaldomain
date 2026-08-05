"use client";

import { useEffect } from "react";

import { AppErrorFallback } from "@/components/app-error-fallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-svh bg-background text-foreground">
        <AppErrorFallback
          title="应用发生严重错误"
          description="根布局渲染失败。请重试；若持续出现，检查部署环境变量与服务端日志。"
          digest={error.digest}
          onRetry={reset}
          homeHref="/"
        />
      </body>
    </html>
  );
}
