import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-neutral-600",
        brand: "bg-brand-50 text-brand-700",
        success: "bg-green-50 text-green-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-700",
        info: "bg-blue-50 text-blue-700",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const ORDER_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "info",
  IN_PROGRESS: "brand",
  READY: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  DISPATCHED: "info",
  OUT_FOR_DELIVERY: "brand",
  FAILED: "danger",
  PAID: "success",
  REFUNDED: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status] ?? "neutral"}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
