/**
 * Seller funnel domain model.
 *
 * These option sets are the single source of truth shared by the funnel UI,
 * the Zod schemas, the scoring engine, and the database enums in
 * supabase/migrations/0002_leads.sql. Changing a value here means changing the
 * migration too.
 *
 * Fair housing: nothing in this file collects, infers, or encodes a protected
 * characteristic, and nothing that does may ever be added.
 */

/** A selectable option with the label a homeowner actually reads. */
export type Option<T extends string> = {
  value: T;
  label: string;
  /** Optional clarifying text shown under the label. */
  hint?: string;
};

// --------------------------------------------------------------- Property

export const PROPERTY_TYPES = [
  "single_family",
  "duplex",
  "multi_family",
  "condo_townhome",
  "mobile_manufactured",
  "land",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_OPTIONS: Option<PropertyType>[] = [
  { value: "single_family", label: "Single-family home" },
  { value: "duplex", label: "Duplex" },
  { value: "multi_family", label: "Multi-family" },
  { value: "condo_townhome", label: "Condo or townhome" },
  { value: "mobile_manufactured", label: "Mobile or manufactured" },
  { value: "land", label: "Land" },
  { value: "other", label: "Something else" },
];

export const OCCUPANCY_STATUSES = ["owner_occupied", "tenant_occupied", "vacant", "unknown"] as const;
export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number];

export const OCCUPANCY_OPTIONS: Option<OccupancyStatus>[] = [
  { value: "owner_occupied", label: "I live there" },
  { value: "tenant_occupied", label: "A tenant lives there" },
  { value: "vacant", label: "It's vacant" },
  { value: "unknown", label: "I'm not sure" },
];

export const YES_NO_UNSURE = ["yes", "no", "unsure"] as const;
export type YesNoUnsure = (typeof YES_NO_UNSURE)[number];

export const PRIMARY_RESIDENCE_OPTIONS: Option<YesNoUnsure>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

// -------------------------------------------------------------- Condition

export const PROPERTY_CONDITIONS = [
  "move_in_ready",
  "minor_updates",
  "major_repairs",
  "full_renovation",
  "not_sure",
] as const;
export type PropertyCondition = (typeof PROPERTY_CONDITIONS)[number];

export const CONDITION_OPTIONS: Option<PropertyCondition>[] = [
  { value: "move_in_ready", label: "Move-in ready", hint: "Someone could live there today." },
  { value: "minor_updates", label: "Needs minor updates", hint: "Cosmetic work, nothing structural." },
  { value: "major_repairs", label: "Needs major repairs", hint: "One or more big-ticket systems." },
  { value: "full_renovation", label: "Needs a full renovation", hint: "Essentially a gut job." },
  { value: "not_sure", label: "I'm not sure", hint: "Perfectly fine — we can work it out together." },
];

export const REPAIR_AREAS = [
  "roof",
  "foundation",
  "plumbing",
  "electrical",
  "hvac",
  "kitchen",
  "bathrooms",
  "water_damage",
  "fire_damage",
  "other",
] as const;
export type RepairArea = (typeof REPAIR_AREAS)[number];

export const REPAIR_AREA_OPTIONS: Option<RepairArea>[] = [
  { value: "roof", label: "Roof" },
  { value: "foundation", label: "Foundation" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "Heating or cooling" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "water_damage", label: "Water damage" },
  { value: "fire_damage", label: "Fire damage" },
  { value: "other", label: "Something else" },
];

// ------------------------------------------------------------- Motivation

export const SELLER_MOTIVATIONS = [
  "inherited",
  "repairs_overwhelming",
  "relocating",
  "tired_landlord",
  "divorce_separation",
  "financial_pressure",
  "behind_on_payments",
  "avoiding_foreclosure",
  "vacant_property",
  "need_to_sell_quickly",
  "exploring_options",
  "other",
] as const;
export type SellerMotivation = (typeof SELLER_MOTIVATIONS)[number];

export const MOTIVATION_OPTIONS: Option<SellerMotivation>[] = [
  { value: "inherited", label: "I inherited a property" },
  { value: "repairs_overwhelming", label: "The repairs feel overwhelming" },
  { value: "relocating", label: "I'm moving or relocating" },
  { value: "tired_landlord", label: "I'm tired of being a landlord" },
  { value: "divorce_separation", label: "Divorce or separation" },
  { value: "financial_pressure", label: "Financial pressure" },
  { value: "behind_on_payments", label: "I'm behind on payments" },
  { value: "avoiding_foreclosure", label: "I'm trying to avoid foreclosure" },
  { value: "vacant_property", label: "The property is vacant" },
  { value: "need_to_sell_quickly", label: "I need to sell quickly" },
  { value: "exploring_options", label: "I'm just exploring my options" },
  { value: "other", label: "Something else" },
];

// --------------------------------------------------------------- Timeline

export const TIMELINE_BUCKETS = ["asap", "1_3_months", "3_6_months", "over_6_months", "researching"] as const;
export type TimelineBucket = (typeof TIMELINE_BUCKETS)[number];

export const TIMELINE_OPTIONS: Option<TimelineBucket>[] = [
  { value: "asap", label: "As soon as possible", hint: "Within about 30 days." },
  { value: "1_3_months", label: "In one to three months" },
  { value: "3_6_months", label: "In three to six months" },
  { value: "over_6_months", label: "More than six months out" },
  { value: "researching", label: "I'm just researching for now" },
];

export const DECISION_MAKER_STATUSES = ["sole", "shared", "unsure"] as const;
export type DecisionMakerStatus = (typeof DECISION_MAKER_STATUSES)[number];

export const DECISION_MAKER_OPTIONS: Option<DecisionMakerStatus>[] = [
  { value: "sole", label: "Yes, it's my decision" },
  { value: "shared", label: "No, another owner or decision-maker is involved" },
  { value: "unsure", label: "I'm not sure" },
];

export const MORTGAGE_STATUSES = ["yes", "no", "unsure", "prefer_not_to_say"] as const;
export type MortgageStatus = (typeof MORTGAGE_STATUSES)[number];

export const MORTGAGE_OPTIONS: Option<MortgageStatus>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "I'm not sure" },
  { value: "prefer_not_to_say", label: "I'd rather not say" },
];

export const PAYOFF_RANGES = [
  "under_50k",
  "50k_100k",
  "100k_150k",
  "150k_250k",
  "over_250k",
  "prefer_not_to_say",
] as const;
export type PayoffRange = (typeof PAYOFF_RANGES)[number];

export const PAYOFF_RANGE_OPTIONS: Option<PayoffRange>[] = [
  { value: "under_50k", label: "Under $50,000" },
  { value: "50k_100k", label: "$50,000 – $100,000" },
  { value: "100k_150k", label: "$100,000 – $150,000" },
  { value: "150k_250k", label: "$150,000 – $250,000" },
  { value: "over_250k", label: "Over $250,000" },
  { value: "prefer_not_to_say", label: "I'd rather not say" },
];

// ---------------------------------------------------------------- Contact

export const CONTACT_METHODS = ["phone", "text", "email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_METHOD_OPTIONS: Option<ContactMethod>[] = [
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
];

export const CONTACT_TIMES = ["morning", "afternoon", "evening", "anytime"] as const;
export type ContactTime = (typeof CONTACT_TIMES)[number];

export const CONTACT_TIME_OPTIONS: Option<ContactTime>[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Anytime" },
];

// ------------------------------------------------------------------ Tiers

export const LEAD_TIERS = ["hot", "warm", "nurture"] as const;
export type LeadTier = (typeof LEAD_TIERS)[number];

export const LEAD_TIER_LABELS: Record<LeadTier, string> = {
  hot: "Hot",
  warm: "Warm",
  nurture: "Nurture / Review",
};

// --------------------------------------------------------------- Pipeline

export const LEAD_STATUSES = [
  "new",
  "attempting_contact",
  "contacted",
  "qualified",
  "appointment_booked",
  "appointment_completed",
  "offer_preparation",
  "offer_sent",
  "negotiating",
  "under_contract",
  "dead_disqualified",
  "nurture",
  "closed_assigned",
  "closed_purchased",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  attempting_contact: "Attempting Contact",
  contacted: "Contacted",
  qualified: "Qualified",
  appointment_booked: "Appointment Booked",
  appointment_completed: "Appointment Completed",
  offer_preparation: "Offer Preparation",
  offer_sent: "Offer Sent",
  negotiating: "Negotiating",
  under_contract: "Under Contract",
  dead_disqualified: "Dead / Disqualified",
  nurture: "Nurture",
  closed_assigned: "Closed / Assigned",
  closed_purchased: "Closed / Purchased",
  lost: "Lost",
};

/** Look up a human label from an option list, falling back to the raw value. */
export function labelFor<T extends string>(options: Option<T>[], value: T | null | undefined) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}
