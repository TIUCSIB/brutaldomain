"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { maskApiKey, maskSecret } from "@/lib/sensitive-value";
import { cn } from "@/lib/utils";

interface SensitiveValueProps {
  value: string;
  kind?: "key" | "secret";
  className?: string;
  codeClassName?: string;
  copyLabel?: string;
}

export function SensitiveValue({
  value,
  kind = "key",
  className,
  codeClassName,
  copyLabel = "已复制",
}: SensitiveValueProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = kind === "secret" ? maskSecret(value) : maskApiKey(value);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copyLabel);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("复制失败");
    }
  }

  return (
    <div className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <code
        className={cn(
          "max-w-[14rem] truncate font-mono text-[11px] sm:max-w-[18rem]",
          codeClassName,
        )}
      >
        {visible ? value : masked}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "隐藏" : "显示"}
        title={visible ? "隐藏" : "显示"}
      >
        {visible ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => void handleCopy()}
        aria-label="复制"
        title="复制"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
