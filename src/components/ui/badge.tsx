import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-cream-200 text-ink-700",
        sage: "bg-sage-100 text-sage-800",
        clay: "bg-clay-100 text-clay-700",
        info: "bg-info-50 text-info-700",
        warn: "bg-warn-50 text-warn-700",
        danger: "bg-danger-50 text-danger-700",
        ink: "bg-ink-800 text-cream-100",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
