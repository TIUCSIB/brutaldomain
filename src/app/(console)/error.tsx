"use client";

import { useEffect } from "react";

import { AppErrorFallback } from "@/components/app-error-fallback";

export default function ConsoleError({
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
    <AppErrorFallback
      title="控制台页面出错"
      description="当前控制台区块加载失败。可重试，或返回 Dashboard。"
      digest={error.digest}
      onRetry={reset}
      homeHref="/dashboard"
    />
  );
}
