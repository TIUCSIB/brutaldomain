import { AppErrorFallback } from "@/components/app-error-fallback";

export default function NotFound() {
  return (
    <AppErrorFallback
      title="页面不存在"
      description="链接可能已失效，或你没有访问该路径的权限。"
      homeHref="/dashboard"
    />
  );
}
