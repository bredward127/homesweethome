"use client";

import { FunnelStep, StepHeading } from "@/components/funnel/funnel-step";
import { RadioGroup } from "@/components/funnel/choice-group";
import { useStepForm } from "@/components/funnel/use-step-form";
import { timelineSchema } from "@/lib/validation/funnel";
import {
  DECISION_MAKER_OPTIONS,
  MORTGAGE_OPTIONS,
  PAYOFF_RANGE_OPTIONS,
  TIMELINE_OPTIONS,
  type DecisionMakerStatus,
  type MortgageStatus,
  type PayoffRange,
  type TimelineBucket,
} from "@/lib/leads/types";

/** Screen 6 — timeline, decision-making, and any balance on the property. */
export function TimelineScreen() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "timeline",
    draftKey: "timeline",
    schema: timelineSchema,
    next: "contact",
  });

  const mortgageStatus = values.mortgageStatus as MortgageStatus | undefined;

  return (
    <FunnelStep step="timeline" onSubmit={submit}>
      <StepHeading
        title="A few practical questions"
        description="These shape what's realistic, so we can be straight with you on the call rather than guessing."
      />

      <RadioGroup
        name="timeline"
        legend="When would you ideally like to sell?"
        options={TIMELINE_OPTIONS}
        value={values.timeline as TimelineBucket | undefined}
        onChange={(value) => setValue({ timeline: value })}
        error={errors.timeline}
      />

      <RadioGroup
        name="decisionMaker"
        legend="Are you the only decision-maker?"
        description="Shared ownership is common and not a problem — it just changes who needs to be on the call."
        options={DECISION_MAKER_OPTIONS}
        value={values.decisionMaker as DecisionMakerStatus | undefined}
        onChange={(value) => setValue({ decisionMaker: value })}
        error={errors.decisionMaker}
      />

      <RadioGroup
        name="mortgageStatus"
        legend="Is there a mortgage, lien, or other balance on the property?"
        options={MORTGAGE_OPTIONS}
        value={mortgageStatus}
        onChange={(value) => setValue({ mortgageStatus: value })}
        error={errors.mortgageStatus}
        columns={2}
      />

      {/* Only worth asking once someone has said there is a balance. */}
      {mortgageStatus === "yes" ? (
        <RadioGroup
          name="payoffRange"
          legend="Roughly how much is still owed?"
          description="Optional, and a rough range is fine. It helps us know early whether the numbers can work."
          options={PAYOFF_RANGE_OPTIONS}
          value={values.payoffRange as PayoffRange | undefined}
          onChange={(value) => setValue({ payoffRange: value })}
          error={errors.payoffRange}
          columns={2}
        />
      ) : null}
    </FunnelStep>
  );
}
