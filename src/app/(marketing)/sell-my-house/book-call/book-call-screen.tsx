"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Phone, ExternalLink } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/layout";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { FunnelProgress } from "@/components/funnel/funnel-progress";
import { useSubmissionResult } from "@/lib/leads/submission-result";
import { trackEvent } from "@/lib/analytics/ga";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { requestAppointmentAction } from "../actions";

/**
 * The booking decision screen.
 *
 * Two paths, and both end with a person:
 *  - Above the configured threshold, the booking step is offered.
 *  - Below it, a warm confirmation plus an always-present "Request a Call".
 *
 * The homeowner is never shown a score, a tier, or any hint of the
 * qualification logic. `bookable` is the only thing that crosses the wire, and
 * it says nothing about why.
 */
export function BookCallScreen({
  provider,
  bookingUrl,
  demoSlots,
}: {
  provider: "calendly" | "generic" | "in_app";
  bookingUrl: string | null;
  demoSlots: string[];
}) {
  const router = useRouter();
  const result = useSubmissionResult();
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<"none" | "requested" | "called">("none");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reaching this screen without having submitted means a stale link or a
  // cleared session; send them back rather than showing an empty page.
  React.useEffect(() => {
    if (!result) router.replace("/sell-my-house/start");
  }, [result, router]);

  React.useEffect(() => {
    if (!result) return;
    if (result.bookable) {
      trackEvent("lead_qualified");
      trackEvent("booking_widget_viewed", { booking_provider: provider });
    }
  }, [result, provider]);

  if (!result) {
    return (
      <Container size="narrow" className="py-16">
        <p className="text-ink-600">Loading your next step…</p>
      </Container>
    );
  }

  const requestSlot = async () => {
    if (!result.token) {
      setError("We couldn't complete that automatically. Please give us a call and we'll book it in.");
      return;
    }
    setPending(true);
    setError(null);
    trackEvent("booking_started", { booking_provider: provider });

    const response = await requestAppointmentAction({
      token: result.token,
      scheduledFor: selectedSlot ?? undefined,
      kind: "booking_request",
    });

    setPending(false);
    if (!response.ok) {
      setError(response.error ?? "Something went wrong. Please call us instead.");
      return;
    }
    trackEvent("booking_completed", { booking_provider: provider });
    setOutcome("requested");
  };

  const requestCall = async () => {
    trackEvent("request_call_clicked");
    if (!result.token) {
      setOutcome("called");
      return;
    }
    setPending(true);
    setError(null);
    const response = await requestAppointmentAction({ token: result.token, kind: "call_request" });
    setPending(false);
    if (!response.ok) {
      setError(response.error ?? "Something went wrong. Please call us instead.");
      return;
    }
    setOutcome("called");
  };

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <FunnelProgress step="booking" />

      <div className="mt-8 flex flex-col gap-6">
        {result.demoMode ? (
          <Alert tone="warn" title="Demo mode">
            Supabase is not configured in this environment, so this submission was scored but not
            saved. See the README for setup.
          </Alert>
        ) : null}

        {outcome !== "none" ? (
          <ConfirmationPanel
            outcome={outcome}
            firstName={result.firstName}
            reference={result.reference}
          />
        ) : result.bookable ? (
          <>
            <header className="flex flex-col gap-3">
              <Badge tone="sage" className="self-start">
                Thanks, {result.firstName}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                You may be a good fit for a quick property conversation.
              </h1>
              <p className="text-lg leading-relaxed text-ink-600">
                Pick a time that suits you and one of our local specialists will call. It usually
                takes about fifteen minutes, and there is no obligation at the end of it.
              </p>
            </header>

            {bookingUrl ? (
              <Card>
                <CardContent className="flex flex-col items-start gap-4">
                  <h2 className="text-lg font-semibold">Choose a time</h2>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                    Our scheduler will open in a new tab so you don&rsquo;t lose this page.
                  </p>
                  <ButtonLink
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="lg"
                    onClick={() => trackEvent("booking_started", { booking_provider: provider })}
                  >
                    <CalendarCheck aria-hidden="true" />
                    Open the booking calendar
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </ButtonLink>
                </CardContent>
              </Card>
            ) : (
              <DemoSlotPicker
                slots={demoSlots}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                onConfirm={requestSlot}
                pending={pending}
              />
            )}
          </>
        ) : (
          <>
            <header className="flex flex-col gap-3">
              <Badge tone="sage" className="self-start">
                Thanks, {result.firstName}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Thanks &mdash; our local team will review the details and reach out shortly.
              </h1>
              <p className="text-lg leading-relaxed text-ink-600">
                Someone will look at what you&rsquo;ve shared and contact you the way you asked us
                to. If you&rsquo;d rather not wait, you can ask us to call you now.
              </p>
            </header>
          </>
        )}

        {error ? (
          <Alert tone="danger" live>
            {error}
          </Alert>
        ) : null}

        {/*
          Always available, whatever the score said. Nobody is blocked from
          reaching a person by a heuristic.
        */}
        {outcome === "none" ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3">
              <h2 className="text-base font-semibold">Would you rather just talk now?</h2>
              <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                Ask us to call you, or ring us directly on{" "}
                <a
                  href={`tel:${siteConfig.phoneHref}`}
                  className="font-semibold text-sage-700 underline underline-offset-4"
                >
                  {siteConfig.phoneDisplay}
                </a>
                .
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" onClick={requestCall} disabled={pending}>
                  <Phone aria-hidden="true" />
                  {pending ? "Sending…" : "Request a Call"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex justify-center pt-2">
          <ButtonLink href="/sell-my-house/thank-you" variant="link">
            Continue
          </ButtonLink>
        </div>

        <FunnelDisclosure />
      </div>
    </Container>
  );
}

function ConfirmationPanel({
  outcome,
  firstName,
  reference,
}: {
  outcome: "requested" | "called";
  firstName: string;
  reference: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Badge tone="sage" className="self-start">
        All set, {firstName}
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {outcome === "requested"
          ? "We've got your preferred time."
          : "We'll call you shortly."}
      </h1>
      <p className="text-lg leading-relaxed text-ink-600">
        {outcome === "requested"
          ? "A specialist will confirm the time with you directly — treat it as requested rather than booked until they do."
          : "One of our local specialists will be in touch using the details you gave us."}
      </p>
      <p className="text-sm text-ink-500">
        Your reference is <span className="font-semibold text-ink-700">{reference}</span>. Quote it
        if you call us.
      </p>
    </div>
  );
}

function DemoSlotPicker({
  slots,
  selected,
  onSelect,
  onConfirm,
  pending,
}: {
  slots: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Request a time</h2>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-600">
            Pick whichever suits you best. We&rsquo;ll confirm it with you before it&rsquo;s
            final.
          </p>
        </div>

        <fieldset>
          <legend className="sr-only">Available times</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {slots.map((slot) => {
              const isSelected = selected === slot;
              return (
                <label
                  key={slot}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-cream-50 p-4 transition-colors",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sage-600",
                    isSelected ? "border-sage-600 bg-sage-50" : "border-cream-300 hover:border-sage-300",
                  )}
                >
                  <input
                    type="radio"
                    name="appointmentSlot"
                    value={slot}
                    checked={isSelected}
                    onChange={() => onSelect(slot)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected ? "border-sage-600 bg-sage-600" : "border-cream-400",
                    )}
                  >
                    {isSelected ? <span className="size-2 rounded-full bg-cream-50" /> : null}
                  </span>
                  <span className="text-[0.9375rem] font-medium text-ink-800">
                    {formatter.format(new Date(slot))}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button onClick={onConfirm} disabled={!selected || pending} size="lg" className="self-start">
          <CalendarCheck aria-hidden="true" />
          {pending ? "Sending…" : "Request this time"}
        </Button>
      </CardContent>
    </Card>
  );
}
