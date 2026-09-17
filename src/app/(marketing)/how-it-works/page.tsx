import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Faq } from "@/components/marketing/faq";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { faqs, processSteps } from "@/config/content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "A plain walkthrough of what happens after you get in touch with Home Sweet Home, step by step.",
  alternates: { canonical: "/how-it-works" },
};

const expectations = [
  {
    title: "What we will ask",
    body: "Where the property is, roughly what condition it is in, who owns it, and what is prompting you to look at selling. You can skip anything you would rather not answer.",
  },
  {
    title: "What we will not do",
    body: "We will not pressure you, put a deadline on you, or keep calling after you tell us you are done. We will not give you legal or tax advice, because that is not our job.",
  },
  {
    title: "What you will get",
    body: "An honest read on the property, the routes available to you, and where we think we can and cannot be useful. Sometimes that means recommending an agent instead.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section tone="cream" className="pb-10 pt-12 sm:pt-20">
        <Container size="narrow" className="flex flex-col items-start gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">How it works</h1>
          <p className="text-lg leading-relaxed text-ink-600">
            Selling a house you did not plan to sell is unsettling. Here is exactly what happens
            from the moment you get in touch, so there are no surprises.
          </p>
        </Container>
      </Section>

      <Section tone="white" className="py-14">
        <Container size="narrow">
          <ol className="flex flex-col gap-6">
            {processSteps.map((step, index) => (
              <li key={step.title} className="flex gap-5">
                <span
                  className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-base font-semibold text-sage-800"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-xl font-semibold">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <SectionHeading eyebrow="Setting expectations" title="What to expect from us" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {expectations.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-600">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
            Want to talk it through?
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-cream-300">
            Start whenever you are ready. There is no obligation and no cost.
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
