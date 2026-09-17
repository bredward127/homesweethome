import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { Container, Section } from "@/components/ui/layout";
import { disclosures } from "@/config/site";

/**
 * Shared shell for the Privacy, Terms, and Disclosures pages.
 *
 * Every one of these documents is a placeholder drafted for structure, not a
 * legal opinion. The banner says so in the page itself rather than only in
 * internal docs, so nobody mistakes the draft for reviewed language.
 */
export function LegalPage({
  title,
  summary,
  lastUpdated,
  children,
}: {
  title: string;
  summary: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Section tone="cream" className="pb-8 pt-12 sm:pt-16">
        <Container size="narrow" className="flex flex-col items-start gap-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-lg leading-relaxed text-ink-600">{summary}</p>
          <p className="text-sm text-ink-500">
            Last updated {lastUpdated} · Policy version {disclosures.policyVersion}
          </p>
        </Container>
      </Section>

      <Section tone="white" className="py-12">
        <Container size="narrow" className="flex flex-col gap-8">
          <Alert tone="warn" title="Draft pending legal review">
            This document is a working placeholder prepared to establish structure. It has not
            been reviewed by counsel and must be replaced with language approved for Michigan and
            for this business before launch.
          </Alert>

          <div className="flex flex-col gap-8 text-[0.9375rem] leading-relaxed text-ink-700">
            {children}
          </div>
        </Container>
      </Section>
    </>
  );
}

/** A titled section within a legal document. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink-900">{heading}</h2>
      {children}
    </section>
  );
}

/** A plain bulleted list styled for legal copy. */
export function LegalList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-sage-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
