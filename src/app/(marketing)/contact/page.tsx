import type { Metadata } from "next";
import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Home Sweet Home team in Royal Oak by phone or email. No obligation, no pressure.",
  alternates: { canonical: "/contact" },
};

const expectations = [
  "A real person from the local team, not a call centre.",
  "A conversation about the property and what you are weighing up.",
  "A clear answer on whether we are useful to you — including when we are not.",
];

export default function ContactPage() {
  return (
    <>
      <Section tone="cream" className="pb-10 pt-12 sm:pt-20">
        <Container size="narrow" className="flex flex-col items-start gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Get in touch</h1>
          <p className="text-lg leading-relaxed text-ink-600">
            Call, email, or answer a few questions about the property and we will come to you.
            Whichever is easiest &mdash; there is no wrong way to start.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Phone className="size-4 text-sage-600" aria-hidden="true" />
                  Call us
                </h2>
                <a
                  href={`tel:${siteConfig.phoneHref}`}
                  className="text-lg font-semibold text-sage-700 underline underline-offset-4"
                >
                  {siteConfig.phoneDisplay}
                </a>
                <p className="flex items-center gap-2 text-sm text-ink-600">
                  <Clock className="size-4" aria-hidden="true" />
                  {siteConfig.hours}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Mail className="size-4 text-sage-600" aria-hidden="true" />
                  Email us
                </h2>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="break-all text-lg font-semibold text-sage-700 underline underline-offset-4"
                >
                  {siteConfig.email}
                </a>
                <p className="text-sm text-ink-600">We reply within one business day.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="size-4 text-sage-600" aria-hidden="true" />
                  Where we are
                </h2>
                <address className="text-[0.9375rem] not-italic leading-relaxed text-ink-600">
                  {siteConfig.mailingAddress.line1}
                  <br />
                  {siteConfig.mailingAddress.city}, {siteConfig.mailingAddress.state}{" "}
                  {siteConfig.mailingAddress.postalCode}
                </address>
                <p className="text-sm text-ink-600">Visits by appointment.</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section tone="cream">
        <Container size="narrow">
          <SectionHeading
            eyebrow="What happens next"
            title="What you can expect when you reach out"
          />
          <ul className="mx-auto mt-8 flex max-w-xl flex-col gap-3">
            {expectations.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-cream-300 bg-cream-50 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink-700"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-center gap-4">
            <ButtonLink href="/sell-my-house" size="lg">
              See If We Can Help
            </ButtonLink>
            <FunnelDisclosure className="text-center" />
          </div>
        </Container>
      </Section>
    </>
  );
}
