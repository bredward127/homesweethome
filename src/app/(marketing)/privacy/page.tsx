import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, LegalList } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Home Sweet Home collects, uses, and protects the information you share.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="What we collect when you contact us, why we hold it, who sees it, and how you can ask us to delete it."
      lastUpdated="pending legal review"
    >
      <LegalSection heading="Information we collect">
        <p>When you contact us or complete our property questionnaire, we may collect:</p>
        <LegalList
          items={[
            "Your name, phone number, and email address.",
            "The property address, or the city and ZIP code where the property is located.",
            "Details you choose to share about the property's condition, occupancy, and any balance owed on it.",
            "What is prompting you to consider selling and your preferred timeline.",
            "Your preferred contact method, best time to reach you, and the consents you give.",
            "Technical information such as the pages you visited, the referring site, campaign parameters in the link you followed, and general device type.",
          ]}
        />
        <p>
          You decide how much to share. Most questions are optional, and skipping them does not
          prevent us from speaking with you.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <LegalList
          items={[
            "To review your property and prepare for a conversation with you.",
            "To contact you by the method and at the time you told us you prefer.",
            "To keep an internal record of our discussions and any documents relating to a transaction.",
            "To understand which marketing channels bring homeowners to us, using aggregate data only.",
            "To meet our record-keeping and legal obligations.",
          ]}
        />
        <p>
          We do not sell your personal information. We do not share it with unaffiliated third
          parties for their own marketing.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics and tracking">
        <p>
          We use website analytics to understand how people find and move through this site. Our
          analytics is configured so that personal information &mdash; your name, phone number,
          email address, and the property&rsquo;s street address &mdash; is never transmitted to
          our analytics provider. Analytics records aggregate behaviour such as which pages were
          viewed and which campaign a visit came from.
        </p>
      </LegalSection>

      <LegalSection heading="Communications and consent">
        <p>
          We contact you only after you have agreed to be contacted, and we record when that
          consent was given and which version of this policy was in effect at the time.
          Consenting to be contacted is never a condition of any purchase. Text-message consent
          is asked for separately and can be withdrawn at any time by replying STOP.
        </p>
      </LegalSection>

      <LegalSection heading="How we protect information">
        <LegalList
          items={[
            "Internal records are accessible only to authorised team members who have signed in.",
            "Access is restricted by role, and the database enforces those restrictions independently of the application.",
            "Documents are stored in private storage and are never publicly linkable.",
            "Access to records, document activity, and data exports is logged.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          We keep records for as long as needed for the purposes above and to meet legal and
          record-keeping obligations. Our specific retention periods are being finalised and will
          be stated here before launch.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can ask us for a copy of the information we hold about you, ask us to correct it, or
          ask us to delete it. Email{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="font-semibold text-sage-700 underline underline-offset-4"
          >
            {siteConfig.email}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${siteConfig.phoneHref}`}
            className="font-semibold text-sage-700 underline underline-offset-4"
          >
            {siteConfig.phoneDisplay}
          </a>
          . We will confirm your request and tell you what we are able to do, including where we
          are required to retain certain records.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy can go to {siteConfig.email}. See also our{" "}
          <Link href="/terms" className="font-semibold text-sage-700 underline underline-offset-4">
            Terms of Use
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
