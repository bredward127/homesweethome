import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Focus ring is offset from the control so it stays visible on any surface.
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 " +
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55 " +
    "[&_svg]:size-[1.125em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-sage-600 text-cream-50 hover:bg-sage-700 active:bg-sage-800",
        secondary:
          "bg-cream-50 text-ink-800 ring-1 ring-inset ring-cream-400 hover:bg-cream-200 hover:ring-cream-400",
        outline:
          "bg-transparent text-ink-800 ring-1 ring-inset ring-ink-500/40 hover:bg-ink-800/5",
        ghost: "bg-transparent text-ink-700 hover:bg-ink-800/5",
        clay: "bg-clay-600 text-cream-50 hover:bg-clay-700",
        danger: "bg-danger-600 text-white hover:bg-danger-700",
        link: "rounded-none px-0 text-sage-700 underline underline-offset-4 hover:text-sage-800",
      },
      size: {
        sm: "px-3.5 py-2 text-sm",
        md: "px-5 py-2.5 text-[0.9375rem]",
        lg: "px-7 py-3.5 text-base",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, block, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
  );
}

export type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/** A link styled as a button. Stays an anchor so it keeps link semantics. */
export function ButtonLink({ className, variant, size, block, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}

export { buttonVariants };
