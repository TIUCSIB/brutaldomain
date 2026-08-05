"use client";

import { useEffect } from "react";

import { AppErrorFallback } from "@/components/app-error-fallback";

export default function RootError({
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
      title="页面出了点问题"
      description="渲染或数据加载失败。可重试当前页，或返回控制台继续操作。"
      digest={error.digest}
      onRetry={reset}
    />
  );
}
