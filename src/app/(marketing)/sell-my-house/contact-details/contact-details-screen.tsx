"use client";

import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { FunnelStep, StepHeading } from "@/components/funnel/funnel-step";
import { RadioGroup } from "@/components/funnel/choice-group";
import { useStepForm } from "@/components/funnel/use-step-form";
import { contactDetailsSchema } from "@/lib/validation/funnel";
import {
  CONTACT_METHOD_OPTIONS,
  CONTACT_TIME_OPTIONS,
  type ContactMethod,
  type ContactTime,
} from "@/lib/leads/types";
import { disclosures } from "@/config/site";
import { trackEvent } from "@/lib/analytics/ga";

/**
 * Screen 7 — contact details and consent.
 *
 * This is the first point at which anything would be sent to us, so it says so
 * plainly. Consent boxes are never pre-checked, and SMS consent is asked for
 * separately from general contact consent — bundling them would make the SMS
 * consent worthless.
 */
export function ContactDetailsScreen() {
  const { values, errors, setValue, submit } = useStepForm({
    step: "contact",
    draftKey: "contact",
    schema: contactDetailsSchema,
    next: "review",
  });

  React.useEffect(() => {
    trackEvent("lead_contact_details_started");
  }, []);

  return (
    <FunnelStep step="contact" onSubmit={submit} continueLabel="Review my answers">
      <StepHeading
        title="How should we reach you?"
        description="A real person from the local team will review your answers and get in touch the way you prefer."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          <Input
            name="firstName"
            autoComplete="given-name"
            value={(values.firstName as string) ?? ""}
            onChange={(event) => setValue({ firstName: event.target.value })}
          />
        </Field>

        <Field label="Last name" required error={errors.lastName}>
          <Input
            name="lastName"
            autoComplete="family-name"
            value={(values.lastName as string) ?? ""}
            onChange={(event) => setValue({ lastName: event.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" required error={errors.phone}>
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(248) 555-0134"
            value={(values.phone as string) ?? ""}
            onChange={(event) => setValue({ phone: event.target.value })}
          />
        </Field>

        <Field label="Email" required error={errors.email}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={(values.email as string) ?? ""}
            onChange={(event) => setValue({ email: event.target.value })}
          />
        </Field>
      </div>

      <RadioGroup
        name="preferredContactMethod"
        legend="How would you rather we reach you?"
        options={CONTACT_METHOD_OPTIONS}
        value={values.preferredContactMethod as ContactMethod | undefined}
        onChange={(value) => setValue({ preferredContactMethod: value })}
        error={errors.preferredContactMethod}
        columns={2}
      />

      <RadioGroup
        name="bestTimeToContact"
        legend="When is the best time to catch you?"
        options={CONTACT_TIME_OPTIONS}
        value={values.bestTimeToContact as ContactTime | undefined}
        onChange={(value) => setValue({ bestTimeToContact: value })}
        error={errors.bestTimeToContact}
        columns={2}
      />

      <div className="flex flex-col gap-4 rounded-card border border-cream-300 bg-cream-50 p-5">
        <h2 className="text-base font-semibold text-ink-800">Your permission</h2>

        <Checkbox
          name="contactConsent"
          label={disclosures.contactConsent}
          checked={Boolean(values.contactConsent)}
          onChange={(event) => setValue({ contactConsent: event.target.checked })}
          error={errors.contactConsent}
        />

        <Checkbox
          name="smsConsent"
          label={
            <>
              <span className="font-medium text-ink-800">Optional. </span>
              {disclosures.smsConsent}
            </>
          }
          checked={Boolean(values.smsConsent)}
          onChange={(event) => setValue({ smsConsent: event.target.checked })}
          error={errors.smsConsent}
        />

        <p className="text-xs leading-relaxed text-ink-500">
          Read our{" "}
          <Link href="/privacy" className="font-semibold text-sage-700 underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-semibold text-sage-700 underline underline-offset-4">
            Terms of Use
          </Link>
          . We do not sell your personal information.
        </p>
      </div>

      <p className="flex items-start gap-2 text-sm text-ink-500">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Nothing is sent to us until you press submit on the next screen.
      </p>
    </FunnelStep>
  );
}
