import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  classifyError,
  errorHint,
  errorTitle,
  type ClientErrorKind,
} from "@/lib/api/request-error";

interface ConfigErrorBannerProps {
  error: string | null | unknown;
}

function actionForKind(kind: ClientErrorKind) {
  if (kind === "unauthorized") {
    return { href: "/?error=session_expired", label: "重新登录" };
  }
  if (kind === "config") {
    return { href: "/settings", label: "打开设置" };
  }
  return null;
}

export function ConfigErrorBanner({ error }: ConfigErrorBannerProps) {
  if (!error) return null;

  const classified =
    typeof error === "string"
      ? classifyError(new Error(error))
      : classifyError(error);
  const title = errorTitle(classified.kind);
  const hint = errorHint(classified.kind);
  const action = actionForKind(classified.kind);

  return (
    <section
      role="alert"
      className="border-4 border-border bg-[#fff0f3] p-4 shadow-[4px_4px_0_0_#ff5c7a] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center border-2 border-border bg-[#ff5c7a] text-white shadow-[2px_2px_0_0_var(--border)]">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
            {title}
          </p>
          <h2 className="mt-1 text-xl font-black">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-foreground/80">
            {classified.message}
          </p>
          {hint ? (
            <p className="mt-2 text-sm font-bold leading-6 text-foreground/65">
              {hint}
            </p>
          ) : null}
          {action ? (
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
