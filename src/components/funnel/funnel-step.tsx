"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { FunnelProgress } from "@/components/funnel/funnel-progress";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { backHref, type FunnelStepId } from "@/lib/leads/funnel-steps";
import { trackEvent } from "@/lib/analytics/ga";

/**
 * Shared chrome for a funnel step: progress, the step form, and the
 * Back / Continue controls.
 *
 * Wraps the step content in a real <form>, so Enter submits and the browser's
 * own validation affordances work. Validation is run by the step itself.
 */
export function FunnelStep({
  step,
  onSubmit,
  children,
  continueLabel = "Continue",
  /** Extra analytics parameters for this step. Must contain no PII. */
  trackingParams,
  submitting,
}: {
  step: FunnelStepId;
  onSubmit: () => void;
  children: React.ReactNode;
  continueLabel?: string;
  trackingParams?: Record<string, string | number | boolean | undefined>;
  submitting?: boolean;
}) {
  const headingRef = React.useRef<HTMLDivElement>(null);

  // Announce each step to analytics once, on arrival.
  React.useEffect(() => {
    trackEvent("funnel_step_viewed", { funnel_step: step, ...trackingParams });
    // Only the step identity should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Move focus to the top of the new step so a keyboard or screen-reader user
  // is not left at the bottom of the previous one.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <div ref={headingRef} tabIndex={-1} className="outline-none">
        <FunnelProgress step={step} />
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-8 flex flex-col gap-8"
      >
        {children}

        <div className="flex flex-col-reverse gap-3 border-t border-cream-300 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={backHref(step)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.9375rem] font-medium text-ink-600 hover:text-ink-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>

          <Button type="submit" size="lg" disabled={submitting} className="sm:min-w-44">
            {submitting ? "Working…" : continueLabel}
            {!submitting ? <ArrowRight aria-hidden="true" /> : null}
          </Button>
        </div>
      </form>

      <FunnelDisclosure className="mt-8" />
    </Container>
  );
}

/** A step's question heading, used where the step is not a single fieldset. */
export function StepHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
      {description ? (
        <p className="text-[0.9375rem] leading-relaxed text-ink-600">{description}</p>
      ) : null}
    </div>
  );
}
