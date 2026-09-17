"use client";

import { Field, Textarea } from "@/components/ui/field";
import { FunnelStep } from "@/components/funnel/funnel-step";
import { CheckboxGroup } from "@/components/funnel/choice-group";
import { useStepForm } from "@/components/funnel/use-step-form";
import { situationSchema } from "@/lib/validation/funnel";
import { MOTIVATION_OPTIONS, type SellerMotivation } from "@/lib/leads/types";

/**
 * Screen 5 — why someone may want to sell.
 *
 * The most personal screen in the funnel. The helper copy gives explicit
 * permission to share less, and nothing here is used for anything other than
 * preparing for the conversation.
 */
export function SituationScreen() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "situation",
    draftKey: "situation",
    schema: situationSchema,
    next: "timeline",
  });

  const motivations = (values.motivations as SellerMotivation[] | undefined) ?? [];

  return (
    <FunnelStep step="situation" onSubmit={submit}>
      <CheckboxGroup
        name="motivations"
        legend="What best describes why you may want to sell?"
        description="Choose as many as apply. You can share only what you're comfortable sharing — this just helps us tailor the conversation."
        options={MOTIVATION_OPTIONS}
        value={motivations}
        onChange={(value) => setValue({ motivations: value })}
        error={errors.motivations}
      />

      <Field
        label="Anything you'd like us to know?"
        optional
        error={errors.situationNotes}
        description="Entirely up to you. Plenty of people leave this blank, and that's completely fine."
      >
        <Textarea
          name="situationNotes"
          rows={4}
          placeholder="My mother passed last year and the house has been sitting empty since. My brother and I both need to agree on what happens."
          value={(values.situationNotes as string) ?? ""}
          onChange={(event) => setValue({ situationNotes: event.target.value })}
        />
      </Field>
    </FunnelStep>
  );
}
