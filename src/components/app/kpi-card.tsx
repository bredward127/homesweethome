import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Dashboard KPI tile. `value` is rendered large; `hint` explains what the
 * number counts so a figure is never ambiguous on its own.
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "attention" | "positive";
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        <p
          className={cn(
            "text-3xl font-semibold tabular-nums tracking-tight",
            tone === "attention" && "text-clay-700",
            tone === "positive" && "text-sage-700",
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-xs leading-relaxed text-ink-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
