/**
 * Brand and business configuration.
 *
 * These are the launch defaults. Once the CRM settings tables are populated
 * (Phase 5), an admin can override them in /app/settings; the values here stay
 * as the fallback so the public site always renders.
 */
export const siteConfig = {
  name: "Home Sweet Home",
  tagline: "A simpler path forward for Metro Detroit homeowners.",
  description:
    "Tell us about your property and situation. We review your options with you and help you decide on a next step — no pressure, no obligation.",
  /** Placeholder contact details — replace before launch. */
  phoneDisplay: "(248) 555-0134",
  phoneHref: "+12485550134",
  email: "hello@homesweethome.example",
  mailingAddress: {
    line1: "000 S Main St, Suite 000",
    city: "Royal Oak",
    state: "MI",
    postalCode: "48067",
  },
  hours: "Monday–Saturday, 8am–7pm ET",
} as const;

/**
 * Compliance copy shown on the public site. Written to be non-deceptive: no
 * guaranteed offer, no guaranteed closing, no foreclosure-prevention claim,
 * and no suggestion that this application gives legal advice.
 *
 * Every string here is subject to legal review before launch
 * (see LAUNCH_CHECKLIST.md).
 */
export const disclosures = {
  /** Shown adjacent to every funnel call to action. */
  funnelCta:
    "Home Sweet Home is a real-estate investment and home-buying solutions business. Options and timelines vary by property and situation. Submitting information does not create an obligation or guarantee an offer.",
  /** Shown beside the communication-consent checkbox. */
  contactConsent:
    "I agree that Home Sweet Home may contact me about my property by phone, text, and email. Consent is not a condition of purchase.",
  /** Shown beside the separate, optional SMS consent checkbox. */
  smsConsent:
    "You may also text me about my property. Message and data rates may apply. Message frequency varies. Reply STOP to opt out or HELP for help. Consent to receive texts is not a condition of any purchase.",
  /** Footer-level business identification. */
  businessIdentity:
    "Home Sweet Home is a real-estate investment and home-buying solutions business. We are not a real-estate brokerage, a lender, a law firm, or a housing counselling agency.",
  /** Fair-housing statement. */
  fairHousing:
    "We do business in accordance with federal, state, and local fair-housing laws, and we evaluate every property and inquiry on the same terms.",
  /** Internal-only banner shown across the contracts module. */
  contractsInternal:
    "Use approved state- and transaction-specific documents reviewed by qualified legal counsel. This application does not provide legal advice or create legal agreements.",
  /** Version stamped onto stored consent records; bump when the copy changes. */
  policyVersion: "2026-01-v1",
} as const;

export const publicNav = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/areas-we-serve", label: "Areas We Serve" },
  { href: "/contact", label: "Contact" },
] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclosures", label: "Disclosures" },
] as const;
