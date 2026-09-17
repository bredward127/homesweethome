import { disclosures } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The standing disclosure that sits next to every funnel call to action.
 * Rendered as ordinary readable text, never collapsed or de-emphasised into
 * illegibility.
 */
export function FunnelDisclosure({
  className,
  inverted,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <p
      className={cn(
        "max-w-xl text-xs leading-relaxed",
        inverted ? "text-cream-300" : "text-ink-600",
        className,
      )}
    >
      {disclosures.funnelCta}
    </p>
  );
}
