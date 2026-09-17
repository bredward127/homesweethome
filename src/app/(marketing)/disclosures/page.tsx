import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/marketing/legal-page";
import { disclosures, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Disclosures",
  description:
    "Plain-language disclosures about who Home Sweet Home is, how we make money, and what we do not promise.",
  alternates: { canonical: "/disclosures" },
};

export default function DisclosuresPage() {
  return (
    <LegalPage
      title="Disclosures"
      summary="Who we are, how we make money, and the things we will not claim. Stated plainly, in one place."
      lastUpdated="pending legal review"
    >
      <LegalSection heading="Who we are">
        <p>{disclosures.businessIdentity}</p>
        <p>
          We buy residential property directly, and in some transactions we assign our purchase
          rights to another buyer rather than closing on the property ourselves. Where that is the
          case, it will be disclosed to you in writing as part of the transaction documents.
        </p>
      </LegalSection>

      <LegalSection heading="How we make money">
        <p>
          We make money on the difference between what we pay for a property and what it is
          ultimately worth to us or to another buyer, after costs. Because of that, an offer from
          us will typically be below what a fully repaired, fully marketed, agent-listed sale
          might achieve. What we offer instead is certainty, speed, and no repair or preparation
          work on your side. Whether that trade is worth it is entirely your decision.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not promise">
        <LegalList
          items={[
            "We do not guarantee that you will receive an offer.",
            "We do not guarantee a closing, a closing date, or a specific price.",
            "We do not promise to stop, delay, or resolve a foreclosure, and we are not a foreclosure-rescue service.",
            "We do not provide legal, tax, financial, or housing-counselling advice.",
            "We do not represent you in the sale. We are a buyer, not your agent.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Fair housing">
        <p>{disclosures.fairHousing}</p>
        <p>
          We do not collect, and never consider, information about race, colour, religion, sex,
          familial status, national origin, disability, or any other protected characteristic when
          deciding how to respond to an inquiry or evaluate a property.
        </p>
      </LegalSection>

      <LegalSection heading="Contacting you">
        <p>{disclosures.contactConsent}</p>
        <p>{disclosures.smsConsent}</p>
      </LegalSection>

      <LegalSection heading="Placeholder content on this site">
        <p>
          Some content on this site is illustrative while we finalise launch materials. Customer
          quotations marked &ldquo;Demo content&rdquo; are examples, not statements from real
          customers. Contact details, addresses, and imagery may be placeholders. All of it will
          be replaced with verified material before launch.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          If anything here is unclear, ask us. Call {siteConfig.phoneDisplay} or email{" "}
          {siteConfig.email} and we will explain it in plain terms.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
