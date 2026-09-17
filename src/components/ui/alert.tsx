import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-xl border p-4 text-sm leading-relaxed", {
  variants: {
    tone: {
      info: "border-info-200 bg-info-50 text-info-700",
      warn: "border-warn-200 bg-warn-50 text-warn-700",
      danger: "border-danger-200 bg-danger-50 text-danger-700",
      sage: "border-sage-200 bg-sage-50 text-sage-800",
      neutral: "border-cream-300 bg-cream-200 text-ink-700",
    },
  },
  defaultVariants: { tone: "info" },
});

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string;
    /**
     * Errors and warnings are announced to assistive tech. `role="alert"`
     * implies aria-live="assertive", so it is reserved for problems the user
     * must act on.
     */
    live?: boolean;
  };

export function Alert({ className, tone, title, live, children, ...props }: AlertProps) {
  return (
    <div
      className={cn(alertVariants({ tone }), className)}
      role={live ? "alert" : undefined}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
