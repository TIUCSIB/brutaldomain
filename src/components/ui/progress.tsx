import * as React from "react"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number | null
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value ?? 0))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === null ? undefined : normalizedValue}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full bg-main transition-transform duration-300"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </div>
  )
}

export { Progress }
export type { ProgressProps }
