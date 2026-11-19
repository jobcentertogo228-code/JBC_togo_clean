import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-card text-foreground",
      info: "border-info-border bg-info text-info-foreground",
      success: "border-success-border bg-success text-success-foreground",
      warning: "border-warning-border bg-warning text-warning-foreground",
      destructive: "border-danger-border bg-danger text-danger-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} role="status" {...props} />;
}
