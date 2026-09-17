import { z } from "zod";
import {
  CONTACT_METHODS,
  CONTACT_TIMES,
  DECISION_MAKER_STATUSES,
  MORTGAGE_STATUSES,
  OCCUPANCY_STATUSES,
  PAYOFF_RANGES,
  PROPERTY_CONDITIONS,
  PROPERTY_TYPES,
  REPAIR_AREAS,
  SELLER_MOTIVATIONS,
  TIMELINE_BUCKETS,
  YES_NO_UNSURE,
} from "@/lib/leads/types";

/**
 * Seller funnel validation.
 *
 * One schema per step, composed into `leadSubmissionSchema` for the server
 * action. The client validates to give fast, kind feedback; the server
 * re-validates the same way and trusts nothing the browser sends.
 *
 * Required fields are kept to the minimum that lets us hold a useful
 * conversation: contact details, enough location to know whether we serve the
 * area, and the handful of questions that shape the call. Everything else is
 * optional by design (see PRODUCT_DECISIONS.md).
 */

/** Caps on free text, so a single field cannot be used to stuff the database. */
const SHORT_TEXT = 120;
const MEDIUM_TEXT = 200;
const LONG_TEXT = 2000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

/** US ZIP, five digits or ZIP+4. */
export const zipSchema = z
  .string({ error: "Enter a 5-digit ZIP code." })
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code.");

/**
 * Accepts the ways people actually type a phone number and normalises to
 * digits. Requires a 10-digit NANP number, optionally with a leading 1.
 */
export const phoneSchema = z
  .string({ error: "Enter a phone number so we can reach you." })
  .trim()
  .min(1, "Enter a phone number so we can reach you.")
  .transform((value) => value.replace(/[^\d]/g, ""))
  .refine(
    (digits) => digits.length === 10 || (digits.length === 11 && digits.startsWith("1")),
    "Enter a 10-digit US phone number.",
  )
  .transform((digits) => (digits.length === 11 ? digits.slice(1) : digits));

export const leadEmailSchema = z
  .string({ error: "Enter an email address." })
  .trim()
  .min(1, "Enter an email address.")
  .max(254, "That email address is too long.")
  .email("Enter a valid email address, like you@example.com.")
  .transform((value) => value.toLowerCase());

// ------------------------------------------------------- Step 1: Property

/**
 * Address is conditional: a homeowner who inherited a property may genuinely
 * not have the street address to hand, so the funnel accepts city + ZIP + a
 * description instead of dead-ending on a detail people legitimately lack.
 */
export const propertyAddressSchema = z
  .object({
    addressUnknown: z.boolean().default(false),
    street: optionalText(MEDIUM_TEXT),
    city: z.string({ error: "Enter the city." }).trim().min(1, "Enter the city.").max(SHORT_TEXT),
    state: z
      .string({ error: "Enter the state." })
      .trim()
      .min(2, "Enter the state.")
      .max(SHORT_TEXT)
      .default("Michigan"),
    postalCode: zipSchema,
    propertyDescription: optionalText(LONG_TEXT),
  })
  .superRefine((values, ctx) => {
    if (!values.addressUnknown && !values.street) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["street"],
        message: "Enter the street address, or tick the box below if you don't have it.",
      });
    }
    if (values.addressUnknown && !values.propertyDescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyDescription"],
        message: "Tell us a little about the property so we can identify it.",
      });
    }
  });

export const propertyBasicsSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES, { message: "Choose the property type." }),
  bedrooms: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(0, "Enter 0 or more.")
    .max(50, "Enter a realistic number of bedrooms.")
    .optional(),
  bathrooms: z.coerce
    .number()
    .min(0, "Enter 0 or more.")
    .max(50, "Enter a realistic number of bathrooms.")
    .optional(),
  squareFeet: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(100, "Enter a realistic square footage.")
    .max(100000, "Enter a realistic square footage.")
    .optional(),
  occupancy: z.enum(OCCUPANCY_STATUSES, { message: "Choose who is living there." }),
  isPrimaryResidence: z.enum(YES_NO_UNSURE).optional(),
});

// ------------------------------------------------------ Step 2: Condition

export const conditionSchema = z.object({
  condition: z.enum(PROPERTY_CONDITIONS, {
    error: "Choose the option that fits best — an estimate is fine.",
  }),
  repairAreas: z.array(z.enum(REPAIR_AREAS)).default([]),
  conditionNotes: optionalText(LONG_TEXT),
});

// ------------------------------------------------------ Step 3: Situation

export const situationSchema = z.object({
  motivations: z
    .array(z.enum(SELLER_MOTIVATIONS), {
      error: "Choose at least one — you can pick more than one.",
    })
    .min(1, "Choose at least one — you can pick more than one.")
    .max(SELLER_MOTIVATIONS.length),
  situationNotes: optionalText(LONG_TEXT),
});

// ------------------------------------------------------- Step 4: Timeline

export const timelineSchema = z.object({
  timeline: z.enum(TIMELINE_BUCKETS, { message: "Choose the timeline that fits best." }),
  decisionMaker: z.enum(DECISION_MAKER_STATUSES, {
    message: "Let us know who makes the decision.",
  }),
  mortgageStatus: z.enum(MORTGAGE_STATUSES, { message: "Choose an option." }),
  payoffRange: z.enum(PAYOFF_RANGES).optional(),
});

// ------------------------------------------------ Step 5: Contact details

export const contactDetailsSchema = z.object({
  firstName: z
    .string({ error: "Enter your first name." })
    .trim()
    .min(1, "Enter your first name.")
    .max(SHORT_TEXT),
  lastName: z
    .string({ error: "Enter your last name." })
    .trim()
    .min(1, "Enter your last name.")
    .max(SHORT_TEXT),
  phone: phoneSchema,
  email: leadEmailSchema,
  preferredContactMethod: z.enum(CONTACT_METHODS, {
    message: "Choose how you'd like us to reach you.",
  }),
  bestTimeToContact: z.enum(CONTACT_TIMES, { message: "Choose a time that suits you." }),
  /** Required. Never pre-checked, and never a condition of purchase. */
  contactConsent: z
    .boolean({ error: "Please agree to be contacted so we can reply." })
    .refine((value) => value === true, "Please agree to be contacted so we can reply."),
  /** Separate and genuinely optional. Texting is off unless this is ticked. */
  smsConsent: z.boolean().default(false),
});

// ------------------------------------------------------------ Attribution

/**
 * Marketing attribution. Every field is optional and bounded: these values
 * come from the query string, so they are attacker-controlled and are treated
 * as untrusted text throughout.
 */
export const attributionSchema = z.object({
  utmSource: optionalText(SHORT_TEXT),
  utmMedium: optionalText(SHORT_TEXT),
  utmCampaign: optionalText(SHORT_TEXT),
  utmContent: optionalText(SHORT_TEXT),
  utmTerm: optionalText(SHORT_TEXT),
  referrer: optionalText(MEDIUM_TEXT),
  landingPage: optionalText(MEDIUM_TEXT),
  firstTouchAt: z.string().datetime().optional(),
  lastTouchAt: z.string().datetime().optional(),
});

// ------------------------------------------------------ Full submission

/**
 * What the server action accepts.
 *
 * `honeypot` must be empty — it is a hidden field no human ever sees, so any
 * value means a bot filled the form. `startedAt` backs a minimum time-on-form
 * check for the same reason.
 */
export const leadSubmissionSchema = z.object({
  address: propertyAddressSchema,
  basics: propertyBasicsSchema,
  condition: conditionSchema,
  situation: situationSchema,
  timeline: timelineSchema,
  contact: contactDetailsSchema,
  // Optional rather than defaulted: the transform on each field makes a
  // literal `{}` default unrepresentable. Callers fall back to EMPTY_ATTRIBUTION.
  attribution: attributionSchema.optional(),
  sessionId: z.string().uuid().optional(),
  startedAt: z.string().datetime().optional(),
  honeypot: z
    .string()
    .max(0, "This submission could not be processed.")
    .optional()
    .default(""),
});

export type PropertyAddressInput = z.infer<typeof propertyAddressSchema>;
export type PropertyBasicsInput = z.infer<typeof propertyBasicsSchema>;
export type ConditionInput = z.infer<typeof conditionSchema>;
export type SituationInput = z.infer<typeof situationSchema>;
export type TimelineInput = z.infer<typeof timelineSchema>;
export type ContactDetailsInput = z.infer<typeof contactDetailsSchema>;
export type AttributionInput = z.infer<typeof attributionSchema>;

/** Attribution for a visit that carried no campaign parameters. */
export const EMPTY_ATTRIBUTION: AttributionInput = {
  utmSource: undefined,
  utmMedium: undefined,
  utmCampaign: undefined,
  utmContent: undefined,
  utmTerm: undefined,
  referrer: undefined,
  landingPage: undefined,
};
export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

/** Format a normalised 10-digit phone number for display. */
export function formatPhone(digits: string) {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
