import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Check, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { Faq } from "@/components/marketing/faq";
import {
  demoTestimonials,
  differentiators,
  faqs,
  homeownerSituations,
  processSteps,
  trustStatements,
} from "@/config/content";
import { groupServiceAreasByCounty } from "@/config/service-areas";

export const metadata: Metadata = {
  title: "Sell Your Metro Detroit Home Without the Usual Stress",
  description:
    "Tell us a little about your property and situation. We'll review your options and help you decide on a next step — no pressure.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const counties = groupServiceAreasByCounty();

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <Section tone="cream" className="pt-12 sm:pt-20">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-start gap-6">
              <Badge tone="sage" className="gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                Start in under 2 minutes
              </Badge>

              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Sell Your Metro Detroit Home Without the Usual Stress.
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-ink-600">
                Tell us a little about your property and situation. We&rsquo;ll review your
                options and help you decide on a next step&mdash;no pressure.
              </p>

              <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {trustStatements.map((statement) => (
                  <li key={statement} className="flex items-center gap-2 text-[0.9375rem] text-ink-700">
                    <Check className="size-4 text-sage-600" aria-hidden="true" />
                    {statement}
                  </li>
                ))}
              </ul>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <ButtonLink href="/sell-my-house" size="lg">
                  See If We Can Help
                </ButtonLink>
                <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                  How It Works
                </ButtonLink>
              </div>

              <FunnelDisclosure />
            </div>

            <ImagePlaceholder
              aspect="portrait"
              priority
              label="Photograph of a Metro Detroit residential street"
              className="lg:max-h-[32rem]"
            />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------- How it works */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="How the process works"
            title="Four steps, at your pace"
            description="Nothing happens quickly unless you want it to, and you can stop after any step."
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-full bg-sage-100 text-base font-semibold text-sage-800"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* -------------------------------------------------- Situations */}
      <Section tone="cream">
        <Container>
          <SectionHeading
            eyebrow="Common situations"
            title="Reasons homeowners reach out"
            description="If one of these sounds familiar, you are in good company. None of them is unusual to us."
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {homeownerSituations.map((situation) => (
              <li key={situation.title}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-2">
                    <h3 className="text-base font-semibold">{situation.title}</h3>
                    <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                      {situation.description}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ------------------------------------------------ Why work with */}
      <Section tone="white">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ImagePlaceholder
              aspect="square"
              label="Portrait of the Home Sweet Home local team"
              className="order-last lg:order-first"
            />
            <div>
              <SectionHeading
                align="left"
                eyebrow="Why Home Sweet Home"
                title="Built to be useful, not pushy"
              />
              <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                {differentiators.map((item) => (
                  <div key={item.title}>
                    <dt className="flex items-center gap-2 text-base font-semibold">
                      <Check className="size-4 shrink-0 text-sage-600" aria-hidden="true" />
                      {item.title}
                    </dt>
                    <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-600">
                      {item.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------- Service areas */}
      <Section tone="sage">
        <Container>
          <SectionHeading
            eyebrow="Where we work"
            title="Royal Oak and the communities around it"
            description="We focus on Metro Detroit so we can speak to your neighbourhood specifically."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {counties.map((group) => (
              <Card key={group.county}>
                <CardContent>
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="size-4 text-sage-600" aria-hidden="true" />
                    {group.county} County
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.9375rem] text-ink-600">
                    {group.areas.map((area) => (
                      <li key={area.slug}>{area.city}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-[0.9375rem] text-ink-600">
            Not on the list?{" "}
            <Link href="/areas-we-serve" className="font-semibold text-sage-700 underline underline-offset-4">
              See the full service area
            </Link>{" "}
            or just ask &mdash; we often look a little further out.
          </p>
        </Container>
      </Section>

      {/* ----------------------------------------------- Testimonials */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="What homeowners say"
            title="In their words"
            description="The quotes below are illustrative examples used while we collect permissioned reviews from real customers."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {demoTestimonials.map((testimonial) => (
              <Card key={testimonial.attribution}>
                <CardContent className="flex h-full flex-col gap-4">
                  <Badge tone="warn" className="self-start">
                    Demo content
                  </Badge>
                  <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-ink-700">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <p className="text-sm font-medium text-ink-500">{testimonial.attribution}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* -------------------------------------------------------- FAQ */}
      <Section tone="cream">
        <Container size="narrow">
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          <Faq items={faqs} className="mt-10" />
        </Container>
      </Section>

      {/* -------------------------------------------------- Final CTA */}
      <Section tone="ink">
        <Container size="narrow" className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl">
            Ready to see what your options look like?
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-cream-300">
            Answer a few questions about the property. There is no cost, no obligation, and no
            one will pressure you.
          </p>
          <ButtonLink href="/sell-my-house" size="lg" variant="clay">
            See If We Can Help
          </ButtonLink>
          <FunnelDisclosure inverted className="text-center" />
        </Container>
      </Section>
    </>
  );
}
