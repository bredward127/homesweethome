"use client";

import type { AttributionInput } from "@/lib/validation/funnel";

/**
 * Marketing attribution capture.
 *
 * First touch is recorded once and never overwritten; last touch updates on
 * every visit that carries campaign parameters. Both live in localStorage so a
 * homeowner who arrives from an ad, leaves, and returns directly a week later
 * is still credited to the campaign that found them.
 *
 * Everything here is attacker-controlled text from the query string, so values
 * are length-capped on capture and validated again server-side.
 */

const STORAGE_KEY = "hsh.attribution.v1";

/** Cap on any single captured value, matching the server-side schema. */
const MAX_VALUE_LENGTH = 200;

/**
 * Partial because every field is genuinely absent for a direct visit. The
 * schema's transforms type these as `string | undefined` on a required key,
 * which is not how stored attribution actually behaves.
 */
type StoredAttribution = Partial<AttributionInput> & {
  firstTouchAt?: string;
  lastTouchAt?: string;
};

function clamp(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_VALUE_LENGTH);
}

function read(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredAttribution;
  } catch {
    // Private browsing, disabled storage, or corrupt JSON. Attribution is a
    // nice-to-have; it must never break the funnel.
    return null;
  }
}

function write(value: StoredAttribution) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore: storage may be unavailable or full.
  }
}

/** Read the UTM parameters present on the current URL. */
function currentUtm(search: string): Partial<AttributionInput> {
  const params = new URLSearchParams(search);
  return {
    utmSource: clamp(params.get("utm_source")),
    utmMedium: clamp(params.get("utm_medium")),
    utmCampaign: clamp(params.get("utm_campaign")),
    utmContent: clamp(params.get("utm_content")),
    utmTerm: clamp(params.get("utm_term")),
  };
}

function hasAnyUtm(utm: Partial<AttributionInput>) {
  return Boolean(
    utm.utmSource || utm.utmMedium || utm.utmCampaign || utm.utmContent || utm.utmTerm,
  );
}

/**
 * Record this visit and return the attribution to submit with the lead.
 *
 * Call once on the first funnel screen. Safe to call repeatedly.
 */
export function captureAttribution(now: Date = new Date()): StoredAttribution {
  if (typeof window === "undefined") return {};

  const stored = read() ?? {};
  const utm = currentUtm(window.location.search);
  const timestamp = now.toISOString();

  // Only treat an external referrer as meaningful; internal navigation is not
  // a new touch.
  let referrer: string | undefined;
  try {
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin !== window.location.origin) {
        referrer = clamp(document.referrer);
      }
    }
  } catch {
    referrer = undefined;
  }

  const isNewTouch = hasAnyUtm(utm) || Boolean(referrer);

  const next: StoredAttribution = {
    // First touch wins and is never overwritten.
    utmSource: stored.utmSource ?? utm.utmSource,
    utmMedium: stored.utmMedium ?? utm.utmMedium,
    utmCampaign: stored.utmCampaign ?? utm.utmCampaign,
    utmContent: stored.utmContent ?? utm.utmContent,
    utmTerm: stored.utmTerm ?? utm.utmTerm,
    referrer: stored.referrer ?? referrer,
    landingPage: stored.landingPage ?? clamp(window.location.pathname),
    firstTouchAt: stored.firstTouchAt ?? timestamp,
    lastTouchAt: isNewTouch || !stored.lastTouchAt ? timestamp : stored.lastTouchAt,
  };

  write(next);
  return next;
}

/** Read the stored attribution without recording a new touch. */
export function getAttribution(): StoredAttribution {
  return read() ?? {};
}

/** Clear stored attribution. Used after a successful submission. */
export function clearAttribution() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/** Coarse device bucket for analytics. Never used for scoring. */
export function deviceCategory(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
