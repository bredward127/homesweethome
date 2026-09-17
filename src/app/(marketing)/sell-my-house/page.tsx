import type { Metadata } from "next";
import { Clock, Phone, Mail, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Faq } from "@/components/marketing/faq";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { faqs, processSteps, trustStatements } from "@/config/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sell My House",
  description:
    "Tell Home Sweet Home about your Metro Detroit property and situation. No cost, no obligation, and no pressure.",
  alternates: { canonical: "/sell-my-house" },
};

const whatWeAsk = [
  "Where the property is and roughly what shape it is in.",
  "Who owns it and whether anyone else is part of the decision.",
  "What is prompting you to look at selling, in as much or as little detail as you like.",
  "When you would ideally want this resolved.",
];

export default function SellMyHousePage() {
  return (
    <>
      <Section tone="cream" className="pb-12 pt-12 sm:pt-20">
        <Container size="narrow" className="flex flex-col items-start gap-6">
          <Badge tone="sage" className="gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            Start in under 2 minutes
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Let&rsquo;s learn a little about your home.
          </h1>
          <p className="text-lg leading-relaxed text-ink-600">
            Share a few details about the property and your situation. A local specialist reviews
            it, calls you at a time that suits, and talks you through the options &mdash; including
            the ones that do not involve us.
          </p>

          <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {trustStatements.map((statement) => (
              <li key={statement} className="flex items-center gap-2 text-[0.9375rem] text-ink-700">
                <ShieldCheck className="size-4 text-sage-600" aria-hidden="true" />
                {statement}
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href={`tel:${siteConfig.phoneHref}`} size="lg">
              <Phone aria-hidden="true" />
              Call {siteConfig.phoneDisplay}
            </ButtonLink>
            <ButtonLink href={`mailto:${siteConfig.email}`} size="lg" variant="secondary">
              <Mail aria-hidden="true" />
              Email us
            </ButtonLink>
          </div>

          <FunnelDisclosure />
        </Container>
      </Section>

      <Section tone="white">
        <Container size="narrow">
          <SectionHeading
            align="left"
            eyebrow="Before you start"
            title="What we will ask about"
            description="Nothing here is mandatory. Share only what you are comfortable sharing — it simply helps us prepare for a more useful conversation."
          />
          <ul className="mt-8 flex flex-col gap-3">
            {whatWeAsk.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-cream-300 bg-cream-50 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <SectionHeading eyebrow="The process" title="What happens after you reach out" />
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

      <Section tone="white">
        <Container size="narrow">
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          <Faq items={faqs} className="mt-10" />
        </Container>
      </Section>

      <Section tone="ink">
        <Container size="narrow" className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-cream-50">
            Talk to a local specialist
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-cream-300">
            One conversation, no obligation. If we are not the right fit, we will tell you that
            too.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`tel:${siteConfig.phoneHref}`} size="lg" variant="clay">
              <Phone aria-hidden="true" />
              Call {siteConfig.phoneDisplay}
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline" className="text-cream-100 ring-cream-400/40 hover:bg-cream-50/10">
              Other ways to reach us
            </ButtonLink>
          </div>
          <FunnelDisclosure inverted className="text-center" />
        </Container>
      </Section>
    </>
  );
}
