import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { groupServiceAreasByCounty } from "@/config/service-areas";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Areas We Serve",
  description:
    "Home Sweet Home works with homeowners across Royal Oak and Metro Detroit, including Oakland, Macomb, and Wayne counties.",
  alternates: { canonical: "/areas-we-serve" },
};

export default function AreasWeServePage() {
  const counties = groupServiceAreasByCounty();

  return (
    <>
      <Section tone="cream" className="pb-10 pt-12 sm:pt-20">
        <Container size="narrow" className="flex flex-col items-start gap-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Areas we serve</h1>
          <p className="text-lg leading-relaxed text-ink-600">
            We are based in Royal Oak and work the communities around it. Staying local is what
            lets us talk about your street rather than a regional average.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {counties.map((group) => (
              <Card key={group.county}>
                <CardContent>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="size-4.5 text-sage-600" aria-hidden="true" />
                    {group.county} County
                  </h2>
                  <ul className="mt-4 grid grid-cols-1 gap-y-2 text-[0.9375rem] text-ink-600 sm:grid-cols-2 lg:grid-cols-1">
                    {group.areas.map((area) => (
                      <li key={area.slug}>{area.city}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="sage">
        <Container size="narrow">
          <SectionHeading
            eyebrow="Outside the list?"
            title="It is still worth asking"
            description="Our coverage shifts as the market does, and we regularly look at properties just beyond these boundaries. Tell us where the home is and we will be straight with you about whether we can help."
          />
          <div className="mt-8 flex flex-col items-center gap-4">
            <ButtonLink href="/sell-my-house" size="lg">
              See If We Can Help
            </ButtonLink>
            <p className="text-[0.9375rem] text-ink-600">
              Or call{" "}
              <a
                href={`tel:${siteConfig.phoneHref}`}
                className="font-semibold text-sage-700 underline underline-offset-4"
              >
                {siteConfig.phoneDisplay}
              </a>
            </p>
            <FunnelDisclosure className="text-center" />
          </div>
        </Container>
      </Section>
    </>
  );
}
