import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-base border-2 border-border bg-main/30",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
