"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { FunnelStep, StepHeading } from "@/components/funnel/funnel-step";
import { RadioGroup } from "@/components/funnel/choice-group";
import { useStepForm } from "@/components/funnel/use-step-form";
import { propertyAddressSchema, propertyBasicsSchema } from "@/lib/validation/funnel";
import {
  OCCUPANCY_OPTIONS,
  PRIMARY_RESIDENCE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  type OccupancyStatus,
  type PropertyType,
  type YesNoUnsure,
} from "@/lib/leads/types";
import { publicFeatures } from "@/lib/env";

export function PropertyScreen({ stage }: { stage: "address" | "basics" }) {
  return stage === "basics" ? <BasicsStage /> : <AddressStage />;
}

/** Screen 2 — where the property is. */
function AddressStage() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "address",
    draftKey: "address",
    schema: propertyAddressSchema,
    next: "basics",
  });

  const addressUnknown = Boolean(values.addressUnknown);

  return (
    <FunnelStep step="address" onSubmit={submit}>
      <StepHeading
        title="Where is the property?"
        description="This tells us whether it's in an area we work and helps us look at comparable homes nearby."
      />

      {!addressUnknown ? (
        <Field label="Street address" required error={errors.street}>
          <Input
            name="street"
            autoComplete="street-address"
            placeholder="123 Main St"
            value={(values.street as string) ?? ""}
            onChange={(event) => setValue({ street: event.target.value })}
          />
        </Field>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City" required error={errors.city}>
          <Input
            name="city"
            autoComplete="address-level2"
            placeholder="Royal Oak"
            value={(values.city as string) ?? ""}
            onChange={(event) => setValue({ city: event.target.value })}
          />
        </Field>

        <Field label="State" required error={errors.state}>
          <Input
            name="state"
            autoComplete="address-level1"
            value={(values.state as string) ?? "Michigan"}
            onChange={(event) => setValue({ state: event.target.value })}
          />
        </Field>
      </div>

      <Field
        label="ZIP code"
        required
        error={errors.postalCode}
        description="Five digits is all we need."
      >
        <Input
          name="postalCode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
          placeholder="48067"
          className="sm:max-w-40"
          value={(values.postalCode as string) ?? ""}
          onChange={(event) => setValue({ postalCode: event.target.value })}
        />
      </Field>

      <Checkbox
        name="addressUnknown"
        label="I don't have the exact address available"
        checked={addressUnknown}
        onChange={(event) => setValue({ addressUnknown: event.target.checked })}
      />

      {addressUnknown ? (
        <Field
          label="Tell us about the property"
          required
          error={errors.propertyDescription}
          description="Anything that helps us identify it — the cross streets, the neighbourhood, or how you came to own it."
        >
          <Textarea
            name="propertyDescription"
            rows={4}
            placeholder="A small brick ranch near Woodward and 11 Mile. It belonged to my aunt."
            value={(values.propertyDescription as string) ?? ""}
            onChange={(event) => setValue({ propertyDescription: event.target.value })}
          />
        </Field>
      ) : null}

      {!publicFeatures.addressAutocomplete ? (
        // Visible only in development, so the team knows the integration point
        // exists without showing a homeowner an internal note.
        process.env.NODE_ENV === "development" ? (
          <Alert tone="neutral" title="Address autocomplete is not configured">
            Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable
            address lookup here. The funnel works without it.
          </Alert>
        ) : null
      ) : null}

      <p className="flex items-start gap-2 text-sm text-ink-500">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        We work across Royal Oak and Metro Detroit. If you&rsquo;re just outside, it&rsquo;s still
        worth asking.
      </p>
    </FunnelStep>
  );
}

/** Screen 3 — the property's basic characteristics. */
function BasicsStage() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "basics",
    draftKey: "basics",
    schema: propertyBasicsSchema,
    next: "condition",
  });

  /** Empty string clears the value; anything else is handed to Zod to coerce. */
  const numeric = (raw: string) => (raw === "" ? undefined : raw);

  return (
    <FunnelStep step="basics" onSubmit={submit}>
      <StepHeading
        title="Tell us about the property"
        description="Estimates are completely fine — we're not going to hold you to a square footage."
      />

      <RadioGroup
        name="propertyType"
        legend="What kind of property is it?"
        options={PROPERTY_TYPE_OPTIONS}
        value={values.propertyType as PropertyType | undefined}
        onChange={(value) => setValue({ propertyType: value })}
        error={errors.propertyType}
        columns={2}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Bedrooms" optional error={errors.bedrooms}>
          <Input
            name="bedrooms"
            inputMode="numeric"
            min={0}
            max={50}
            type="number"
            value={(values.bedrooms as string | number | undefined) ?? ""}
            onChange={(event) => setValue({ bedrooms: numeric(event.target.value) })}
          />
        </Field>

        <Field label="Bathrooms" optional error={errors.bathrooms}>
          <Input
            name="bathrooms"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.5}
            type="number"
            value={(values.bathrooms as string | number | undefined) ?? ""}
            onChange={(event) => setValue({ bathrooms: numeric(event.target.value) })}
          />
        </Field>

        <Field label="Square footage" optional error={errors.squareFeet}>
          <Input
            name="squareFeet"
            inputMode="numeric"
            type="number"
            placeholder="1200"
            value={(values.squareFeet as string | number | undefined) ?? ""}
            onChange={(event) => setValue({ squareFeet: numeric(event.target.value) })}
          />
        </Field>
      </div>

      <RadioGroup
        name="occupancy"
        legend="Who is living there right now?"
        options={OCCUPANCY_OPTIONS}
        value={values.occupancy as OccupancyStatus | undefined}
        onChange={(value) => setValue({ occupancy: value })}
        error={errors.occupancy}
        columns={2}
      />

      <RadioGroup
        name="isPrimaryResidence"
        legend="Is this your primary residence?"
        description="Optional — it affects the tax side for you, which is worth knowing before we talk."
        options={PRIMARY_RESIDENCE_OPTIONS}
        value={values.isPrimaryResidence as YesNoUnsure | undefined}
        onChange={(value) => setValue({ isPrimaryResidence: value })}
        error={errors.isPrimaryResidence}
        columns={2}
      />
    </FunnelStep>
  );
}
