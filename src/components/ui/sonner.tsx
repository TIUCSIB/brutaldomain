"use client"

import * as React from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "group toast !rounded-base !border-2 !border-border !bg-secondary-background !text-foreground !shadow-shadow",
          title: "!font-black",
          description: "!font-medium !text-foreground/70",
          actionButton:
            "!rounded-base !border-2 !border-border !bg-main !font-bold !text-main-foreground !shadow-[2px_2px_0_0_var(--border)]",
          cancelButton:
            "!rounded-base !border-2 !border-border !bg-secondary-background !font-bold !text-foreground",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
export type { ToasterProps }
