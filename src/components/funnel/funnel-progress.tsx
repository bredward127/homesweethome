import { TOTAL_STEPS, type FunnelStepId, stepNumber } from "@/lib/leads/funnel-steps";

/**
 * Funnel progress indicator.
 *
 * A real `<progress>` element, so assistive tech reports position without
 * extra ARIA, plus a visible "Step N of 8" label — a bar alone tells someone
 * with low vision very little.
 */
export function FunnelProgress({ step }: { step: FunnelStepId }) {
  const current = stepNumber(step);
  const percent = Math.round((current / TOTAL_STEPS) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink-700">
          Step {current} of {TOTAL_STEPS}
        </p>
        <p className="text-sm text-ink-500">{percent}% complete</p>
      </div>
      <progress
        value={current}
        max={TOTAL_STEPS}
        aria-label={`Step ${current} of ${TOTAL_STEPS}`}
        className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-sage-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-cream-300 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sage-600"
      />
    </div>
  );
}
