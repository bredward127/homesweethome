import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Empty state for CRM lists. Always says what the list holds and what the
 * user can do next, rather than just "No results".
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-cream-400 bg-cream-50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="text-sage-600" aria-hidden="true">{icon}</div> : null}
      <p className="text-base font-semibold text-ink-800">{title}</p>
      {description ? <p className="max-w-md text-sm text-ink-600">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
