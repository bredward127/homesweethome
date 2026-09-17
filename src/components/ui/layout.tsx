import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  size = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "narrow" | "default" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  tone = "cream",
  ...props
}: React.HTMLAttributes<HTMLElement> & { tone?: "cream" | "white" | "sage" | "ink" }) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        tone === "cream" && "bg-cream-100",
        tone === "white" && "bg-cream-50",
        tone === "sage" && "bg-sage-50",
        tone === "ink" && "bg-ink-800 text-cream-100",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  inverted,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.12em]",
            inverted ? "text-sage-300" : "text-sage-700",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-semibold tracking-tight sm:text-4xl",
          inverted && "text-cream-50",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("text-lg leading-relaxed", inverted ? "text-cream-300" : "text-ink-600")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
