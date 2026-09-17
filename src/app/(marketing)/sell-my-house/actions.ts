"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/auth/audit";
import { issueLeadToken, verifyLeadToken } from "@/lib/security/lead-token";
import { LEAD_SUBMISSION_LIMIT, rateLimit } from "@/lib/security/rate-limit";
import { checkForBot } from "@/lib/security/bot-check";
import { leadSubmissionSchema, type LeadSubmission } from "@/lib/validation/funnel";
import {
  DEFAULT_FOLLOW_UP,
  DEFAULT_RULESET,
  followUpDueAt,
  followUpTaskFor,
  isBookable,
  isInServiceArea,
  scoreLead,
  type ScoringRuleset,
} from "@/lib/leads/scoring";
import { defaultServiceAreas } from "@/config/service-areas";
import { disclosures } from "@/config/site";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Public lead submission.
 *
 * This is the only internet-facing write path in the application, so it is
 * the one place that gets rate limiting, bot checks, and an entirely
 * server-constructed insert. No user-supplied column name, table, or filter
 * ever reaches a query — the payload is parsed into a known shape first and
 * every field is written explicitly.
 *
 * It writes through the service-role client because the submitter is
 * anonymous and `anon` has no privileges on these tables at all.
 */

/** What the browser is told. Deliberately excludes the score and the tier. */
export type SubmitLeadResult =
  | {
      ok: true;
      reference: string;
      firstName: string;
      /** Whether to offer the booking step. Never the score behind it. */
      bookable: boolean;
      /** Capability token for the booking / request-a-call actions. */
      token: string | null;
      /** True when Supabase is unconfigured and nothing was persisted. */
      demoMode: boolean;
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Salted hash of the client IP. Never store or log a raw address. */
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "home-sweet-home";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function clientIpFrom(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return headerList.get("x-real-ip");
}

/** One generic message for every rejection a bot might be probing. */
const GENERIC_FAILURE =
  "We couldn't submit that just now. Please try again, or call us and we'll take the details over the phone.";

export async function submitLeadAction(payload: unknown): Promise<SubmitLeadResult> {
  const headerList = await headers();
  const ip = clientIpFrom(headerList);
  const ipHash = hashIp(ip);
  const userAgent = headerList.get("user-agent");

  // --- 1. Rate limit before doing any work -----------------------------
  const limitKey = `lead-submit:${ipHash ?? "unknown"}`;
  const limit = rateLimit(limitKey, LEAD_SUBMISSION_LIMIT);
  if (!limit.allowed) {
    return {
      ok: false,
      error:
        "That's a few submissions in a short time. Please wait a few minutes and try again, or give us a call.",
    };
  }

  // --- 2. Validate ------------------------------------------------------
  const parsed = leadSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Some answers need a second look before we can send this.",
      fieldErrors,
    };
  }
  const submission = parsed.data;

  // --- 3. Bot checks ----------------------------------------------------
  const botCheck = checkForBot({
    honeypot: submission.honeypot,
    startedAt: submission.startedAt,
  });
  if (!botCheck.ok) {
    // Never tell the submitter which check failed.
    console.warn(`[funnel] rejected submission (${botCheck.reason})`);
    return { ok: false, error: GENERIC_FAILURE };
  }

  const supabase = createAdminClient();

  // --- 4. Load the live configuration, falling back to code defaults ----
  const { ruleset, bookableThreshold, followUp, serviceAreas } = await loadScoringContext();

  // --- 5. Score ---------------------------------------------------------
  const inServiceArea = isInServiceArea(submission.address.postalCode, serviceAreas);

  const score = scoreLead(
    {
      timeline: submission.timeline.timeline,
      motivations: submission.situation.motivations,
      condition: submission.condition.condition,
      occupancy: submission.basics.occupancy,
      decisionMaker: submission.timeline.decisionMaker,
      hasVerifiedContact: Boolean(submission.contact.phone && submission.contact.email),
      hasUsableAddress: !submission.address.addressUnknown && Boolean(submission.address.street),
      inServiceArea,
    },
    ruleset,
  );

  const bookable = isBookable(score, bookableThreshold);
  const sellerName = `${submission.contact.firstName} ${submission.contact.lastName}`;

  // --- 6. Demo mode: no Supabase, so nothing is persisted ---------------
  if (!supabase) {
    console.info("[funnel] demo mode — lead was scored but not persisted (Supabase unconfigured).");
    return {
      ok: true,
      reference: "HSH-DEMO",
      firstName: submission.contact.firstName,
      bookable,
      token: null,
      demoMode: true,
    };
  }

  try {
    // --- 7. Property ----------------------------------------------------
    const matchedArea = serviceAreas.find((area) =>
      area.postalCodes.includes(submission.address.postalCode.slice(0, 5)),
    );

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        street: submission.address.street ?? null,
        city: submission.address.city,
        state: submission.address.state,
        postal_code: submission.address.postalCode,
        address_unknown: submission.address.addressUnknown,
        property_description: submission.address.propertyDescription ?? null,
        property_type: submission.basics.propertyType,
        bedrooms: submission.basics.bedrooms ?? null,
        bathrooms: submission.basics.bathrooms ?? null,
        square_feet: submission.basics.squareFeet ?? null,
        occupancy: submission.basics.occupancy,
        is_primary_residence: submission.basics.isPrimaryResidence ?? null,
        condition: submission.condition.condition,
        repair_areas: submission.condition.repairAreas,
        condition_notes: submission.condition.conditionNotes ?? null,
        service_area_id: matchedArea?.id ?? null,
        in_service_area: inServiceArea,
      })
      .select("id")
      .single();

    if (propertyError || !property) throw propertyError ?? new Error("Property insert returned no row");

    // --- 8. Lead --------------------------------------------------------
    const attribution = submission.attribution;

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        property_id: property.id,
        first_name: submission.contact.firstName,
        last_name: submission.contact.lastName,
        phone: submission.contact.phone,
        email: submission.contact.email,
        preferred_contact_method: submission.contact.preferredContactMethod,
        best_time_to_contact: submission.contact.bestTimeToContact,
        motivations: submission.situation.motivations,
        situation_notes: submission.situation.situationNotes ?? null,
        timeline: submission.timeline.timeline,
        decision_maker: submission.timeline.decisionMaker,
        mortgage_status: submission.timeline.mortgageStatus,
        payoff_range: submission.timeline.payoffRange ?? null,
        status: "new",
        tier: score.tier,
        score: score.total,
        utm_source: attribution?.utmSource ?? null,
        utm_medium: attribution?.utmMedium ?? null,
        utm_campaign: attribution?.utmCampaign ?? null,
        utm_content: attribution?.utmContent ?? null,
        utm_term: attribution?.utmTerm ?? null,
        referrer: attribution?.referrer ?? null,
        landing_page: attribution?.landingPage ?? null,
        first_touch_at: attribution?.firstTouchAt ?? null,
        last_touch_at: attribution?.lastTouchAt ?? null,
        source: "website_funnel",
      })
      .select("id, reference")
      .single();

    if (leadError || !lead) throw leadError ?? new Error("Lead insert returned no row");

    // --- 9. Score history, consent, funnel session, follow-up task ------
    // Each of these is supporting evidence around a lead that already exists,
    // so a failure here is logged but does not lose the lead itself.
    const supporting = await Promise.allSettled([
      supabase.from("lead_scores").insert({
        lead_id: lead.id,
        total: score.total,
        tier: score.tier,
        reasons: score.reasons as unknown as Json,
        flags: score.flags as unknown as Json,
        rules_version: score.rulesVersion,
        scored_at: score.scoredAt,
      }),

      supabase.from("lead_consents").insert([
        {
          lead_id: lead.id,
          consent_type: "contact" as const,
          granted: submission.contact.contactConsent,
          consent_text: disclosures.contactConsent,
          policy_version: disclosures.policyVersion,
          ip_hash: ipHash,
          user_agent: userAgent,
        },
        {
          lead_id: lead.id,
          consent_type: "sms" as const,
          granted: submission.contact.smsConsent,
          consent_text: disclosures.smsConsent,
          policy_version: disclosures.policyVersion,
          ip_hash: ipHash,
          user_agent: userAgent,
        },
      ]),

      supabase.from("lead_funnel_sessions").insert({
        lead_id: lead.id,
        started_at: submission.startedAt ?? null,
        completed_at: new Date().toISOString(),
        completed: true,
        last_step: "review",
        raw_answers: toRawAnswers(submission),
        landing_page: attribution?.landingPage ?? null,
        referrer: attribution?.referrer ?? null,
        user_agent: userAgent,
        ip_hash: ipHash,
      }),

      supabase.from("tasks").insert({
        ...taskFieldsFor(score.tier, sellerName, followUp),
        lead_id: lead.id,
        property_id: property.id,
        task_type: "call" as const,
      }),
    ]);

    for (const [index, outcome] of supporting.entries()) {
      if (outcome.status === "rejected") {
        console.error(`[funnel] supporting write ${index} failed:`, outcome.reason);
      } else if (outcome.value.error) {
        console.error(`[funnel] supporting write ${index} failed:`, outcome.value.error.message);
      }
    }

    // --- 10. Audit ------------------------------------------------------
    // Identifiers and tier only. Never the seller's details.
    await recordAudit({
      action: "record_created",
      entityType: "lead",
      entityId: lead.id,
      summary: `Lead ${lead.reference} created from the public funnel`,
      metadata: {
        reference: lead.reference,
        tier: score.tier,
        in_service_area: inServiceArea,
        rules_version: score.rulesVersion,
        source: "website_funnel",
      },
    });

    return {
      ok: true,
      reference: lead.reference,
      firstName: submission.contact.firstName,
      bookable,
      token: issueLeadToken(lead.id),
      demoMode: false,
    };
  } catch (error) {
    // The homeowner gets a route to a human; the detail stays in our logs.
    console.error("[funnel] lead submission failed:", error);
    return { ok: false, error: GENERIC_FAILURE };
  }
}

/**
 * Record an appointment request or a request-a-call.
 *
 * Accepts only a signed capability token, never a raw lead ID, so it cannot be
 * pointed at a lead the caller did not just create.
 */
export async function requestAppointmentAction(input: {
  token: string;
  /** ISO timestamp of a chosen demo slot, when one was picked. */
  scheduledFor?: string;
  kind: "booking_request" | "call_request";
}): Promise<{ ok: boolean; error?: string }> {
  const verified = verifyLeadToken(input.token);
  if (!verified.valid) {
    return {
      ok: false,
      error: "That request has expired. Please call us and we'll sort it out straight away.",
    };
  }

  const headerList = await headers();
  const ipHash = hashIp(clientIpFrom(headerList));
  const limit = rateLimit(`appointment-request:${ipHash ?? "unknown"}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: GENERIC_FAILURE };

  const supabase = createAdminClient();
  if (!supabase) return { ok: true };

  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const validSlot =
    scheduledFor && !Number.isNaN(scheduledFor.getTime()) && scheduledFor > new Date()
      ? scheduledFor.toISOString()
      : null;

  const { error } = await supabase.from("appointments").insert({
    lead_id: verified.leadId,
    status: "requested",
    scheduled_for: validSlot,
    booking_provider: "in_app_request",
    notes:
      input.kind === "call_request"
        ? "Seller asked to be called. No specific time selected."
        : "Seller requested an appointment slot from the funnel. Confirm before treating as booked.",
  });

  if (error) {
    console.error("[funnel] appointment request failed:", error.message);
    return { ok: false, error: GENERIC_FAILURE };
  }

  await recordAudit({
    action: "record_created",
    entityType: "appointment",
    entityId: verified.leadId,
    summary:
      input.kind === "call_request"
        ? "Seller requested a call from the funnel"
        : "Seller requested an appointment slot from the funnel",
    metadata: { kind: input.kind, has_slot: Boolean(validSlot) },
  });

  return { ok: true };
}

// ------------------------------------------------------------- Internals

type ServiceAreaLike = { id?: string; postalCodes: string[]; active: boolean };

/**
 * Load the live scoring configuration.
 *
 * Every lookup falls back to the in-code default, so a database hiccup
 * degrades the score's accuracy rather than losing the lead.
 */
async function loadScoringContext(): Promise<{
  ruleset: ScoringRuleset;
  bookableThreshold: number;
  followUp: typeof DEFAULT_FOLLOW_UP;
  serviceAreas: ServiceAreaLike[];
}> {
  const supabase = createAdminClient();

  const fallback = {
    ruleset: DEFAULT_RULESET,
    bookableThreshold: 60,
    followUp: DEFAULT_FOLLOW_UP,
    serviceAreas: defaultServiceAreas.map((area) => ({
      postalCodes: area.postalCodes,
      active: area.active,
    })),
  };

  if (!supabase) return fallback;

  const [rulesResult, settingsResult, areasResult] = await Promise.allSettled([
    supabase
      .from("scoring_rules")
      .select("version, definition, hot_threshold, warm_threshold")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("funnel_settings")
      .select(
        "bookable_score_threshold, hot_followup_minutes, warm_followup_hours, nurture_followup_days",
      )
      .maybeSingle(),
    supabase.from("service_areas").select("id, postal_codes, is_active").eq("is_active", true),
  ]);

  let ruleset = DEFAULT_RULESET;
  if (rulesResult.status === "fulfilled" && rulesResult.value.data) {
    const row = rulesResult.value.data;
    const definition = row.definition as { signals?: Record<string, unknown> } | null;
    // Only trust a stored definition that actually carries signals; otherwise
    // an empty or malformed row would silently score everything at baseline.
    if (definition?.signals && Object.keys(definition.signals).length > 0) {
      ruleset = {
        version: row.version,
        signals: definition.signals as ScoringRuleset["signals"],
        thresholds: { hot: row.hot_threshold, warm: row.warm_threshold },
      };
    }
  }

  let bookableThreshold = fallback.bookableThreshold;
  let followUp = DEFAULT_FOLLOW_UP;
  if (settingsResult.status === "fulfilled" && settingsResult.value.data) {
    const row = settingsResult.value.data;
    bookableThreshold = row.bookable_score_threshold;
    followUp = {
      hotFollowUpMinutes: row.hot_followup_minutes,
      warmFollowUpHours: row.warm_followup_hours,
      nurtureFollowUpDays: row.nurture_followup_days,
    };
  }

  let serviceAreas = fallback.serviceAreas;
  if (areasResult.status === "fulfilled" && areasResult.value.data?.length) {
    serviceAreas = areasResult.value.data.map((row) => ({
      id: row.id,
      postalCodes: row.postal_codes ?? [],
      active: row.is_active,
    }));
  }

  return { ruleset, bookableThreshold, followUp, serviceAreas };
}

function taskFieldsFor(
  tier: "hot" | "warm" | "nurture",
  sellerName: string,
  followUp: typeof DEFAULT_FOLLOW_UP,
) {
  const task = followUpTaskFor(tier, sellerName);
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_at: followUpDueAt(tier, followUp).toISOString(),
  };
}

/** The complete answer set, stored verbatim for auditability. */
function toRawAnswers(submission: LeadSubmission): Json {
  return {
    address: submission.address,
    basics: submission.basics,
    condition: submission.condition,
    situation: submission.situation,
    timeline: submission.timeline,
    contact: {
      // The seller's identity already lives on the lead row; there is no
      // reason to duplicate it into a JSON blob as well.
      preferredContactMethod: submission.contact.preferredContactMethod,
      bestTimeToContact: submission.contact.bestTimeToContact,
      contactConsent: submission.contact.contactConsent,
      smsConsent: submission.contact.smsConsent,
    },
  } as unknown as Json;
}
