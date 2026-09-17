import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, LegalList } from "@/components/marketing/legal-page";
import { disclosures, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern your use of the Home Sweet Home website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      summary="The basis on which this website is provided, and what it does and does not commit either of us to."
      lastUpdated="pending legal review"
    >
      <LegalSection heading="About this site">
        <p>{disclosures.businessIdentity}</p>
        <p>
          This website is informational. Nothing on it is an offer to purchase any property, and
          nothing on it creates a contract between you and {siteConfig.name}.
        </p>
      </LegalSection>

      <LegalSection heading="No guarantee of an offer or a closing">
        <p>
          Submitting information through this site does not obligate you to sell, does not
          obligate us to buy, and does not guarantee that you will receive an offer. Whether we
          can make an offer, and on what terms, depends on the property, the title, the numbers,
          and your circumstances. Any offer, if one is made, will be set out in a separate written
          agreement.
        </p>
      </LegalSection>

      <LegalSection heading="Not legal, tax, or financial advice">
        <p>
          We are not a law firm, a lender, a licensed real-estate brokerage, a housing counselling
          agency, or a tax adviser, and we do not provide advice in any of those areas. You should
          consult your own qualified professionals before entering into any real-estate
          transaction.
        </p>
      </LegalSection>

      <LegalSection heading="Accuracy of information you provide">
        <p>
          We rely on the details you share to prepare for our conversation. Please keep them
          accurate, and tell us if something changes &mdash; particularly about ownership,
          occupancy, or any balance owed on the property.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <LegalList
          items={[
            "Do not submit information about a property you have no authority to discuss.",
            "Do not submit another person's personal information without their knowledge.",
            "Do not attempt to gain access to areas of this site reserved for our internal team.",
            "Do not use automated tools to submit forms or scrape this site.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Site availability and content">
        <p>
          We provide this site as-is and may change or withdraw any part of it. Photographs and
          illustrative content on this site may be placeholders and do not depict specific
          properties or specific customers unless we say so.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are intended to be governed by the laws of the State of Michigan. Final
          governing-law, dispute-resolution, and liability provisions are pending review by
          counsel.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can go to {siteConfig.email}. See also our{" "}
          <Link href="/privacy" className="font-semibold text-sage-700 underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/disclosures"
            className="font-semibold text-sage-700 underline underline-offset-4"
          >
            Disclosures
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
