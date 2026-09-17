"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FunnelStep, StepHeading } from "@/components/funnel/funnel-step";
import { useFunnel } from "@/components/funnel/funnel-provider";
import { getAttribution } from "@/lib/leads/attribution";
import { storeSubmissionResult } from "@/lib/leads/submission-result";
import { stepHref, type FunnelStepId } from "@/lib/leads/funnel-steps";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/bot-check";
import { formatPhone } from "@/lib/validation/funnel";
import { trackEvent } from "@/lib/analytics/ga";
import {
  CONDITION_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  CONTACT_TIME_OPTIONS,
  DECISION_MAKER_OPTIONS,
  MORTGAGE_OPTIONS,
  MOTIVATION_OPTIONS,
  OCCUPANCY_OPTIONS,
  PAYOFF_RANGE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  REPAIR_AREA_OPTIONS,
  TIMELINE_OPTIONS,
  labelFor,
  type ContactMethod,
  type ContactTime,
  type DecisionMakerStatus,
  type MortgageStatus,
  type OccupancyStatus,
  type PayoffRange,
  type PropertyCondition,
  type PropertyType,
  type RepairArea,
  type SellerMotivation,
  type TimelineBucket,
} from "@/lib/leads/types";
import { submitLeadAction } from "../actions";

type Row = { label: string; value: React.ReactNode };

/** Screen 8 — a friendly recap, with a way back to any step. */
export function ReviewScreen() {
  const router = useRouter();
  const { draft, startedAt, hydrated } = useFunnel();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [honeypot, setHoneypot] = React.useState("");

  const address = draft.address ?? {};
  const basics = draft.basics ?? {};
  const condition = draft.condition ?? {};
  const situation = draft.situation ?? {};
  const timeline = draft.timeline ?? {};
  const contact = draft.contact ?? {};

  // Someone who lands here with an empty draft skipped the funnel; send them
  // back to the start rather than showing an empty summary.
  React.useEffect(() => {
    if (hydrated && !contact.email) router.replace(stepHref("address"));
  }, [hydrated, contact.email, router]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const result = await submitLeadAction({
      address,
      basics,
      condition,
      situation,
      timeline,
      contact,
      attribution: getAttribution(),
      startedAt,
      honeypot,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    trackEvent("lead_submitted", {
      property_type: basics.propertyType,
      timeline_bucket: timeline.timeline,
    });

    storeSubmissionResult({
      reference: result.reference,
      firstName: result.firstName,
      bookable: result.bookable,
      token: result.token,
      demoMode: result.demoMode,
    });

    router.push(stepHref("booking"));
  };

  const sections: { title: string; step: FunnelStepId; rows: Row[] }[] = [
    {
      title: "The property",
      step: "address",
      rows: [
        {
          label: "Address",
          value: address.addressUnknown
            ? `${address.city ?? ""}, ${address.state ?? ""} ${address.postalCode ?? ""} (exact address not available)`
            : [address.street, address.city, `${address.state ?? ""} ${address.postalCode ?? ""}`]
                .filter(Boolean)
                .join(", "),
        },
        ...(address.propertyDescription
          ? [{ label: "Description", value: address.propertyDescription }]
          : []),
      ],
    },
    {
      title: "Property details",
      step: "basics",
      rows: [
        { label: "Type", value: labelFor(PROPERTY_TYPE_OPTIONS, basics.propertyType as PropertyType) },
        { label: "Bedrooms", value: basics.bedrooms ?? "Not given" },
        { label: "Bathrooms", value: basics.bathrooms ?? "Not given" },
        { label: "Square footage", value: basics.squareFeet ?? "Not given" },
        { label: "Occupancy", value: labelFor(OCCUPANCY_OPTIONS, basics.occupancy as OccupancyStatus) },
      ],
    },
    {
      title: "Condition",
      step: "condition",
      rows: [
        { label: "Overall", value: labelFor(CONDITION_OPTIONS, condition.condition as PropertyCondition) },
        {
          label: "Needs attention",
          value:
            (condition.repairAreas as RepairArea[] | undefined)?.length
              ? (condition.repairAreas as RepairArea[])
                  .map((area) => labelFor(REPAIR_AREA_OPTIONS, area))
                  .join(", ")
              : "Nothing flagged",
        },
        ...(condition.conditionNotes ? [{ label: "Notes", value: condition.conditionNotes }] : []),
      ],
    },
    {
      title: "Your situation",
      step: "situation",
      rows: [
        {
          label: "Reasons",
          value: (situation.motivations as SellerMotivation[] | undefined)
            ?.map((motivation) => labelFor(MOTIVATION_OPTIONS, motivation))
            .join(", "),
        },
        ...(situation.situationNotes ? [{ label: "Notes", value: situation.situationNotes }] : []),
      ],
    },
    {
      title: "Timeline",
      step: "timeline",
      rows: [
        { label: "Ideal timing", value: labelFor(TIMELINE_OPTIONS, timeline.timeline as TimelineBucket) },
        {
          label: "Decision-maker",
          value: labelFor(DECISION_MAKER_OPTIONS, timeline.decisionMaker as DecisionMakerStatus),
        },
        {
          label: "Balance owed",
          value: labelFor(MORTGAGE_OPTIONS, timeline.mortgageStatus as MortgageStatus),
        },
        ...(timeline.payoffRange
          ? [
              {
                label: "Approximate payoff",
                value: labelFor(PAYOFF_RANGE_OPTIONS, timeline.payoffRange as PayoffRange),
              },
            ]
          : []),
      ],
    },
    {
      title: "Contact details",
      step: "contact",
      rows: [
        { label: "Name", value: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() },
        { label: "Phone", value: contact.phone ? formatPhone(String(contact.phone)) : null },
        { label: "Email", value: contact.email },
        {
          label: "Preferred contact",
          value: labelFor(CONTACT_METHOD_OPTIONS, contact.preferredContactMethod as ContactMethod),
        },
        {
          label: "Best time",
          value: labelFor(CONTACT_TIME_OPTIONS, contact.bestTimeToContact as ContactTime),
        },
        { label: "Text messages", value: contact.smsConsent ? "Yes, texting is fine" : "No texts" },
      ],
    },
  ];

  return (
    <FunnelStep
      step="review"
      onSubmit={submit}
      continueLabel="See My Next Step"
      submitting={submitting}
    >
      <StepHeading
        title="Does this look right?"
        description="Have a quick look before we send it. You can change anything — nothing is final until you press the button."
      />

      {error ? (
        <Alert tone="danger" live title="We couldn't send that">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-base font-semibold text-ink-800">{section.title}</h2>
                <Link
                  href={stepHref(section.step)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-sage-700 hover:bg-sage-50"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                  <span className="sr-only"> {section.title}</span>
                </Link>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
                {section.rows
                  .filter((row) => row.value !== null && row.value !== undefined && row.value !== "")
                  .map((row) => (
                    <React.Fragment key={row.label}>
                      <dt className="text-sm text-ink-500">{row.label}</dt>
                      <dd className="text-[0.9375rem] text-ink-800">{row.value}</dd>
                    </React.Fragment>
                  ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {/*
        Honeypot: hidden from sight and from assistive tech, and excluded from
        tab order, so no person will ever fill it in. Anything in it is a bot.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto size-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD_NAME}>Company website</label>
        <input
          id={HONEYPOT_FIELD_NAME}
          name={HONEYPOT_FIELD_NAME}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
    </FunnelStep>
  );
}
