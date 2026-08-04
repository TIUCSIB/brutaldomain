import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-base font-medium text-foreground shadow-shadow outline-none transition-[color,box-shadow,transform] placeholder:text-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
