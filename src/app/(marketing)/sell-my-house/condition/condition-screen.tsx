"use client";

import { Camera } from "lucide-react";
import { Field, Textarea } from "@/components/ui/field";
import { FunnelStep } from "@/components/funnel/funnel-step";
import { CheckboxGroup, RadioGroup } from "@/components/funnel/choice-group";
import { useStepForm } from "@/components/funnel/use-step-form";
import { conditionSchema } from "@/lib/validation/funnel";
import {
  CONDITION_OPTIONS,
  REPAIR_AREA_OPTIONS,
  type PropertyCondition,
  type RepairArea,
} from "@/lib/leads/types";

/** Screen 4 — condition, plus optional detail on what needs work. */
export function ConditionScreen() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "condition",
    draftKey: "condition",
    schema: conditionSchema,
    next: "situation",
  });

  const condition = values.condition as PropertyCondition | undefined;
  const repairAreas = (values.repairAreas as RepairArea[] | undefined) ?? [];

  return (
    <FunnelStep step="condition" onSubmit={submit}>
      <RadioGroup
        name="condition"
        legend="How would you describe the property's condition?"
        description="Your honest read is more useful than a precise one. We look at homes in every condition."
        options={CONDITION_OPTIONS}
        value={condition}
        onChange={(value) => setValue({ condition: value })}
        error={errors.condition}
      />

      <CheckboxGroup
        name="repairAreas"
        legend="Anything in particular that needs attention?"
        description="Optional. Tick anything that comes to mind — it helps us come to the call prepared."
        options={REPAIR_AREA_OPTIONS}
        value={repairAreas}
        onChange={(value) => setValue({ repairAreas: value })}
        error={errors.repairAreas}
      />

      <Field
        label="Anything else about the condition?"
        optional
        error={errors.conditionNotes}
        description="Only if it's useful. A sentence is plenty."
      >
        <Textarea
          name="conditionNotes"
          rows={3}
          placeholder="The roof was replaced about three years ago, but the basement takes water when it rains hard."
          value={(values.conditionNotes as string) ?? ""}
          onChange={(event) => setValue({ conditionNotes: event.target.value })}
        />
      </Field>

      {/*
        Photo upload is offered after submission rather than here: uploading
        files is the slowest part of any mobile form, and we would rather not
        lose someone at this point. See the thank-you screen.
      */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-cream-400 bg-cream-50 px-5 py-4">
        <Camera className="mt-0.5 size-5 shrink-0 text-sage-600" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-600">
          <span className="font-medium text-ink-800">Photos are welcome, but not now.</span>{" "}
          If you&rsquo;d like to share any, we&rsquo;ll offer you the option once you&rsquo;ve
          finished &mdash; no need to hunt for them mid-form.
        </p>
      </div>
    </FunnelStep>
  );
}
