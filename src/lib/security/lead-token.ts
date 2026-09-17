import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived capability tokens for post-submission actions.
 *
 * After submitting the funnel, a homeowner can request a call or book an
 * appointment. Those actions need to name their lead — but a raw lead ID in
 * the browser would let anyone enumerate UUIDs and attach appointments to
 * other people's leads.
 *
 * So the submit action issues an HMAC-signed token binding the lead ID to an
 * expiry. Follow-up actions accept the token, never a bare ID. The token
 * grants exactly one narrow capability (attach an appointment request to this
 * lead) and expires quickly.
 */

/** Tokens outlive the booking step but not the session. */
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  // The service-role key never leaves the server, which makes it a usable
  // signing secret. A dedicated LEAD_TOKEN_SECRET would be better hygiene and
  // is worth adding before launch.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXTAUTH_SECRET;
  if (key) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cannot sign lead tokens: SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  // Development without Supabase: tokens are still signed, just not secretly.
  return "home-sweet-home-development-only";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Issue a token binding `leadId` to an expiry. */
export function issueLeadToken(leadId: string, now: Date = new Date()): string {
  const expiresAt = now.getTime() + TOKEN_TTL_MS;
  const payload = `${leadId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export type LeadTokenResult =
  | { valid: true; leadId: string }
  | { valid: false; reason: "malformed" | "expired" | "bad_signature" };

/** Verify a token and recover the lead ID it names. */
export function verifyLeadToken(token: string, now: Date = new Date()): LeadTokenResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, reason: "malformed" };

  const [leadId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!leadId || !Number.isFinite(expiresAt)) return { valid: false, reason: "malformed" };

  const expected = sign(`${leadId}.${expiresAtRaw}`);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  // Compare in constant time, and only after a length check — timingSafeEqual
  // throws on a length mismatch.
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return { valid: false, reason: "bad_signature" };
  }

  // Expiry is checked after the signature, so an attacker cannot learn
  // anything from the ordering.
  if (expiresAt <= now.getTime()) return { valid: false, reason: "expired" };

  return { valid: true, leadId };
}
