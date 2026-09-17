import type {
  DecisionMakerStatus,
  LeadTier,
  OccupancyStatus,
  PropertyCondition,
  SellerMotivation,
  TimelineBucket,
} from "@/lib/leads/types";

/**
 * Lead scoring.
 *
 * Explainable by construction: every point awarded comes from a named signal
 * that records its own reason, so a score can always be shown back to the team
 * as "here is why". Rules are data, not code, so an admin can tune them in
 * Settings without a deploy, and every score records the rule `version` that
 * produced it — which is what keeps an old score interpretable after the rules
 * change.
 *
 * FAIR HOUSING — HARD CONSTRAINT
 * Inputs are restricted to property attributes, timeline, decision-making
 * structure, contact completeness, and service-area coverage. No protected
 * characteristic (race, colour, religion, sex, familial status, national
 * origin, disability) or proxy for one is collected anywhere in this codebase,
 * and none may ever be added to this model.
 *
 * The score is INTERNAL ONLY. It is never shown to a homeowner, and it never
 * alone decides whether someone can reach a person — see `isBookable`.
 */

/** The facts the model is allowed to look at. */
export type ScoringInput = {
  timeline: TimelineBucket;
  motivations: readonly SellerMotivation[];
  condition: PropertyCondition;
  occupancy: OccupancyStatus;
  decisionMaker: DecisionMakerStatus;
  /** True when both a usable phone number and email address were provided. */
  hasVerifiedContact: boolean;
  /** True when a street address (not just city/ZIP) was supplied. */
  hasUsableAddress: boolean;
  /** True when the ZIP falls inside an active service area. */
  inServiceArea: boolean;
};

/** One rule's contribution to the total. */
export type ScoreReason = {
  key: string;
  label: string;
  points: number;
};

export type ScoreResult = {
  /** Clamped to 0–100. */
  total: number;
  tier: LeadTier;
  /** Every rule that fired, most significant first. */
  reasons: ScoreReason[];
  /** Non-scoring observations worth a human's attention. */
  flags: string[];
  rulesVersion: number;
  scoredAt: string;
};

/** Thresholds separating the tiers. */
export type ScoringThresholds = {
  hot: number;
  warm: number;
};

export const DEFAULT_THRESHOLDS: ScoringThresholds = { hot: 70, warm: 45 };

/**
 * The starting ruleset (version 1), seeded into `scoring_rules`.
 *
 * Weights are the launch hypothesis, not received wisdom. They should be
 * revisited once there is enough closed-deal data to tell which signals
 * actually predicted a transaction.
 */
export type SignalRule = {
  key: string;
  label: string;
  points: number;
};

export const DEFAULT_SIGNALS = {
  timeline_asap: { key: "timeline_asap", label: "Wants to sell as soon as possible", points: 20 },
  timeline_1_3_months: { key: "timeline_1_3_months", label: "Timeline of one to three months", points: 12 },
  timeline_over_6_months: { key: "timeline_over_6_months", label: "Timeline beyond six months", points: -8 },
  just_exploring: { key: "just_exploring", label: "Just exploring options", points: -10 },
  vacant: { key: "vacant", label: "Property is vacant", points: 15 },
  inherited: { key: "inherited", label: "Inherited property", points: 15 },
  major_repairs: { key: "major_repairs", label: "Needs major repairs or a full renovation", points: 12 },
  financial_pressure: { key: "financial_pressure", label: "Financial pressure, behind on payments, or foreclosure concern", points: 15 },
  tired_landlord: { key: "tired_landlord", label: "Tired landlord", points: 10 },
  relocating: { key: "relocating", label: "Relocating", points: 8 },
  sole_decision_maker: { key: "sole_decision_maker", label: "Sole decision-maker", points: 8 },
  shared_decision_maker: { key: "shared_decision_maker", label: "More than one decision-maker", points: -3 },
  verified_contact: { key: "verified_contact", label: "Usable phone and email provided", points: 5 },
  in_service_area: { key: "in_service_area", label: "In an active service area", points: 10 },
  outside_service_area: { key: "outside_service_area", label: "Outside our service areas", points: -20 },
  missing_address: { key: "missing_address", label: "No usable street address", points: -8 },
} as const satisfies Record<string, SignalRule>;

export type SignalKey = keyof typeof DEFAULT_SIGNALS;

/** A complete, versioned ruleset as stored in `scoring_rules.definition`. */
export type ScoringRuleset = {
  version: number;
  signals: Record<string, SignalRule>;
  thresholds: ScoringThresholds;
};

export const DEFAULT_RULESET: ScoringRuleset = {
  version: 1,
  signals: DEFAULT_SIGNALS,
  thresholds: DEFAULT_THRESHOLDS,
};

/** Motivations that all point at the same underlying financial urgency. */
const FINANCIAL_PRESSURE_MOTIVATIONS: readonly SellerMotivation[] = [
  "financial_pressure",
  "behind_on_payments",
  "avoiding_foreclosure",
];

/**
 * Score a lead.
 *
 * Scoring starts at a neutral 50 so that a lead with no strong signal either
 * way lands in Warm rather than at the bottom of the pipeline. Signals move it
 * from there, and the total is clamped to 0–100.
 */
export function scoreLead(
  input: ScoringInput,
  ruleset: ScoringRuleset = DEFAULT_RULESET,
  now: Date = new Date(),
): ScoreResult {
  const signals = ruleset.signals;
  const reasons: ScoreReason[] = [];
  const flags: string[] = [];

  /** Record a rule as fired. Unknown or zero-weighted rules are skipped. */
  const award = (key: string) => {
    const rule = signals[key];
    if (!rule || rule.points === 0) return;
    reasons.push({ key: rule.key, label: rule.label, points: rule.points });
  };

  // --- Timeline -------------------------------------------------------
  if (input.timeline === "asap") award("timeline_asap");
  else if (input.timeline === "1_3_months") award("timeline_1_3_months");
  else if (input.timeline === "over_6_months") award("timeline_over_6_months");
  else if (input.timeline === "researching") award("just_exploring");

  // --- Motivation -----------------------------------------------------
  const motivations = new Set(input.motivations);

  if (motivations.has("inherited")) award("inherited");
  if (motivations.has("tired_landlord")) award("tired_landlord");
  if (motivations.has("relocating")) award("relocating");

  // The three financial-urgency motivations score once, not three times —
  // someone ticking all of them is describing one situation, not three.
  if (FINANCIAL_PRESSURE_MOTIVATIONS.some((motivation) => motivations.has(motivation))) {
    award("financial_pressure");
  }

  // "Just exploring" only counts against a lead when it is not paired with a
  // concrete timeline; someone exploring *and* needing to move in 30 days is
  // not a low-intent lead.
  if (motivations.has("exploring_options") && input.timeline !== "asap" && input.timeline !== "1_3_months") {
    if (input.timeline !== "researching") award("just_exploring");
  }

  // --- Property -------------------------------------------------------
  if (input.occupancy === "vacant" || motivations.has("vacant_property")) award("vacant");
  if (input.condition === "major_repairs" || input.condition === "full_renovation") {
    award("major_repairs");
  }

  // --- Decision making ------------------------------------------------
  if (input.decisionMaker === "sole") award("sole_decision_maker");
  else if (input.decisionMaker === "shared") award("shared_decision_maker");

  // --- Contactability and coverage ------------------------------------
  if (input.hasVerifiedContact) award("verified_contact");
  if (!input.hasUsableAddress) award("missing_address");
  if (input.inServiceArea) award("in_service_area");
  else award("outside_service_area");

  // --- Flags: worth a human's attention, but never scored --------------
  // A tenant complicates a deal; it does not make it a bad one, so this
  // costs no points.
  if (input.occupancy === "tenant_occupied") {
    flags.push("Tenant occupied — confirm lease terms and tenant rights before proceeding.");
  }
  if (input.decisionMaker === "shared" || input.decisionMaker === "unsure") {
    flags.push("More than one decision-maker may be involved — confirm who must sign.");
  }
  if (!input.inServiceArea) {
    flags.push("ZIP code is outside the active service areas — confirm before working the lead.");
  }
  if (!input.hasUsableAddress) {
    flags.push("No street address supplied — identify the property before the call.");
  }
  if (motivations.has("avoiding_foreclosure")) {
    flags.push(
      "Mentioned foreclosure — do not make any foreclosure-prevention promise, and follow the approved script.",
    );
  }

  const BASELINE = 50;
  const raw = reasons.reduce((sum, reason) => sum + reason.points, BASELINE);
  const total = Math.max(0, Math.min(100, raw));

  return {
    total,
    tier: tierFor(total, ruleset.thresholds),
    reasons: [...reasons].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
    flags,
    rulesVersion: ruleset.version,
    scoredAt: now.toISOString(),
  };
}

/** Map a total to its tier. */
export function tierFor(total: number, thresholds: ScoringThresholds = DEFAULT_THRESHOLDS): LeadTier {
  if (total >= thresholds.hot) return "hot";
  if (total >= thresholds.warm) return "warm";
  return "nurture";
}

/**
 * Whether the booking step is offered.
 *
 * Deliberately separate from the score itself: a homeowner below the threshold
 * still gets a warm confirmation and an always-available "request a call"
 * action. Nobody is blocked from reaching a person by a heuristic.
 */
export function isBookable(score: ScoreResult, threshold: number): boolean {
  return score.total >= threshold;
}

/** Minutes within which the first follow-up task is due, by tier. */
export type FollowUpSettings = {
  hotFollowUpMinutes: number;
  warmFollowUpHours: number;
  nurtureFollowUpDays: number;
};

export const DEFAULT_FOLLOW_UP: FollowUpSettings = {
  hotFollowUpMinutes: 15,
  warmFollowUpHours: 24,
  nurtureFollowUpDays: 7,
};

/** When the first follow-up task for a lead falls due. */
export function followUpDueAt(
  tier: LeadTier,
  settings: FollowUpSettings = DEFAULT_FOLLOW_UP,
  now: Date = new Date(),
): Date {
  const due = new Date(now);
  if (tier === "hot") due.setMinutes(due.getMinutes() + settings.hotFollowUpMinutes);
  else if (tier === "warm") due.setHours(due.getHours() + settings.warmFollowUpHours);
  else due.setDate(due.getDate() + settings.nurtureFollowUpDays);
  return due;
}

/** The first task created for a new lead, worded for whoever picks it up. */
export function followUpTaskFor(tier: LeadTier, sellerName: string) {
  if (tier === "hot") {
    return {
      title: `Call ${sellerName} now — hot lead`,
      priority: "high" as const,
      description:
        "Scored Hot on submission. Call immediately; speed to first contact is the single biggest factor in whether this converts.",
    };
  }
  if (tier === "warm") {
    return {
      title: `Call ${sellerName} — warm lead`,
      priority: "medium" as const,
      description: "Scored Warm on submission. Reach out today or first thing on the next business day.",
    };
  }
  return {
    title: `Follow up with ${sellerName}`,
    priority: "low" as const,
    description:
      "Scored Nurture. Review the answers, confirm the property is worth working, and follow up on the nurture cadence.",
  };
}

/** Whether a ZIP code falls inside any active service area. */
export function isInServiceArea(
  postalCode: string,
  areas: readonly { postalCodes: readonly string[]; active?: boolean; is_active?: boolean }[],
): boolean {
  const zip = postalCode.trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return false;
  return areas.some((area) => {
    const active = area.active ?? area.is_active ?? true;
    return active && area.postalCodes.includes(zip);
  });
}
