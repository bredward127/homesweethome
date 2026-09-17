"use client";

import * as React from "react";
import { Camera, CheckCircle2, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/layout";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { useSubmissionResult } from "@/lib/leads/submission-result";
import { useFunnel } from "@/components/funnel/funnel-provider";
import { trackEvent } from "@/lib/analytics/ga";
import { siteConfig } from "@/config/site";

/**
 * Screen 10 — confirmation.
 *
 * Also where the funnel draft is cleared: by this point the lead is safely
 * recorded, so keeping a copy of someone's answers on their device serves no
 * purpose.
 */
export function ThankYouScreen() {
  const { reset } = useFunnel();
  const result = useSubmissionResult();

  // Fire-and-forget side effects only — no setState, so no cascading render.
  React.useEffect(() => {
    trackEvent("thank_you_viewed");
    reset();
  }, [reset]);

  const firstName = result?.firstName;

  const nextSteps = [
    "A team member reviews what you shared about the property.",
    "They contact you using the method and at the time you told us you prefer.",
    "You talk it through — and decide nothing until you're ready to.",
  ];

  return (
    <Container size="narrow" className="py-12 sm:py-20">
      <div className="flex flex-col items-start gap-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-sage-100 text-sage-700">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>

        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {firstName ? `Thank you, ${firstName}.` : "Thank you."} We&rsquo;ve got everything we
          need for now.
        </h1>

        <p className="text-lg leading-relaxed text-ink-600">
          A team member will review the information and contact you using your preferred method.
          There is nothing else you need to do.
        </p>

        {result?.reference && result.reference !== "HSH-DEMO" ? (
          <p className="rounded-xl border border-cream-300 bg-cream-50 px-5 py-4 text-[0.9375rem] text-ink-700">
            Your reference is{" "}
            <span className="font-semibold text-ink-900">{result.reference}</span>. Quote it if you
            call us and we&rsquo;ll find you straight away.
          </p>
        ) : null}

        <Card className="w-full">
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">What happens next</h2>
            <ol className="flex flex-col gap-2.5">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-700">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-sage-800"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/*
          Photos are invited here rather than mid-funnel. Secure upload to a
          private Supabase Storage bucket lands with the documents module in
          Phase 4; until then this points people at email so the offer is real.
        */}
        <Card className="w-full">
          <CardContent className="flex flex-col items-start gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Camera className="size-4.5 text-sage-600" aria-hidden="true" />
              Want to send photos?
            </h2>
            <p className="text-[0.9375rem] leading-relaxed text-ink-600">
              Entirely optional, and no need to tidy first. Photos of the outside, the kitchen, and
              anything that needs work help us come to the call better prepared.
            </p>
            <ButtonLink
              href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(
                `Property photos${result?.reference ? ` — ${result.reference}` : ""}`,
              )}`}
              variant="secondary"
            >
              Email photos to us
            </ButtonLink>
          </CardContent>
        </Card>

        <div className="flex w-full flex-col gap-3 rounded-card border border-cream-300 bg-cream-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Phone className="size-4.5 text-sage-600" aria-hidden="true" />
            Need us sooner?
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-ink-600">
            Call{" "}
            <a
              href={`tel:${siteConfig.phoneHref}`}
              className="font-semibold text-sage-700 underline underline-offset-4"
            >
              {siteConfig.phoneDisplay}
            </a>{" "}
            &mdash; {siteConfig.hours}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="ghost">
            Read how the process works
          </ButtonLink>
        </div>

        <FunnelDisclosure />
      </div>
    </Container>
  );
}
