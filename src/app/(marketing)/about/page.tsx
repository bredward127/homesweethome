import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { differentiators } from "@/config/content";
import { disclosures, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Home Sweet Home is a local Metro Detroit home-buying business built around straight answers and unhurried conversations.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "Respect the situation",
    body: "People reach out to us in the middle of something — a death, a divorce, a move, a run of bad luck. We behave accordingly.",
  },
  {
    title: "Say the true thing",
    body: "If a route other than ours serves you better, we say so plainly. A reputation in a market this size is worth more than any single deal.",
  },
  {
    title: "Stay local",
    body: "We work Royal Oak and the communities around it. Knowing the streets is the whole advantage, so we do not dilute it.",
  },
  {
    title: "Move at your pace",
    body: "No countdown timers, no expiring offers, no calls after you have said no. Urgency, when it exists, belongs to you, not us.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section tone="cream" className="pb-10 pt-12 sm:pt-20">
        <Container size="narrow" className="flex flex-col items-start gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            A local option, run by people you can reach
          </h1>
          <p className="text-lg leading-relaxed text-ink-600">
            {siteConfig.name} is a small Metro Detroit team that buys homes directly and helps
            owners work out what to do with a property that has become a burden. We are not a
            national brand running ads at you, and we are not trying to be.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ImagePlaceholder aspect="square" label="Photograph of the local Home Sweet Home team" />
            <div>
              <SectionHeading align="left" eyebrow="What we care about" title="How we work" />
              <dl className="mt-8 flex flex-col gap-6">
                {values.map((value) => (
                  <div key={value.title}>
                    <dt className="text-base font-semibold">{value.title}</dt>
                    <dd className="mt-1.5 leading-relaxed text-ink-600">{value.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <SectionHeading eyebrow="Why homeowners choose us" title="What you can count on" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {differentiators.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="white" className="py-14">
        <Container size="narrow">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">Who we are, precisely</h2>
              <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                {disclosures.businessIdentity}
              </p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-600">
                {disclosures.fairHousing}
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section tone="ink">
        <Container size="narrow" className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-cream-50">
            Start a conversation
          </h2>
          <ButtonLink href="/sell-my-house" size="lg" variant="clay">
            See If We Can Help
          </ButtonLink>
          <FunnelDisclosure inverted className="text-center" />
        </Container>
      </Section>
    </>
  );
}
