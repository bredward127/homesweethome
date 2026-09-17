import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  LEAD_SUBMISSION_LIMIT,
  rateLimit,
  resetRateLimits,
} from "@/lib/security/rate-limit";
import { MIN_FORM_DURATION_MS, checkForBot } from "@/lib/security/bot-check";

beforeEach(() => {
  resetRateLimits();
});

describe("rateLimit", () => {
  const options = { limit: 3, windowMs: 60_000 };

  it("allows requests up to the limit", () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      expect(rateLimit("ip-a", options, 1000).allowed, `attempt ${attempt}`).toBe(true);
    }
  });

  it("blocks once the limit is exceeded", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) rateLimit("ip-a", options, 1000);
    const blocked = rateLimit("ip-a", options, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts down the remaining allowance", () => {
    expect(rateLimit("ip-a", options, 1000).remaining).toBe(2);
    expect(rateLimit("ip-a", options, 1000).remaining).toBe(1);
    expect(rateLimit("ip-a", options, 1000).remaining).toBe(0);
  });

  it("keys separately per caller", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) rateLimit("ip-a", options, 1000);
    expect(rateLimit("ip-a", options, 1000).allowed).toBe(false);
    // A different IP is unaffected.
    expect(rateLimit("ip-b", options, 1000).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) rateLimit("ip-a", options, 1000);
    expect(rateLimit("ip-a", options, 1000).allowed).toBe(false);
    // One millisecond past the window.
    expect(rateLimit("ip-a", options, 61_001).allowed).toBe(true);
  });

  it("uses a limit that permits ordinary human use", () => {
    // A household discussing two properties must not be locked out.
    expect(LEAD_SUBMISSION_LIMIT.limit).toBeGreaterThanOrEqual(3);
    expect(LEAD_SUBMISSION_LIMIT.windowMs).toBeGreaterThan(0);
  });
});

describe("checkForBot", () => {
  const now = Date.parse("2026-03-10T12:00:00.000Z");
  const longEnoughAgo = new Date(now - 60_000).toISOString();

  it("passes an ordinary submission", () => {
    expect(checkForBot({ honeypot: "", startedAt: longEnoughAgo }, now)).toEqual({ ok: true });
  });

  it("rejects a filled honeypot", () => {
    const result = checkForBot({ honeypot: "https://spam.example" }, now);
    expect(result).toEqual({ ok: false, reason: "honeypot" });
  });

  it("ignores a whitespace-only honeypot", () => {
    expect(checkForBot({ honeypot: "   ", startedAt: longEnoughAgo }, now).ok).toBe(true);
  });

  it("rejects an implausibly fast submission", () => {
    const justNow = new Date(now - 100).toISOString();
    expect(checkForBot({ startedAt: justNow }, now)).toEqual({ ok: false, reason: "too_fast" });
  });

  it("accepts a submission at the duration boundary", () => {
    const atBoundary = new Date(now - MIN_FORM_DURATION_MS).toISOString();
    expect(checkForBot({ startedAt: atBoundary }, now).ok).toBe(true);
  });

  it("allows a missing or unparseable start time rather than blocking a real person", () => {
    expect(checkForBot({}, now).ok).toBe(true);
    expect(checkForBot({ startedAt: null }, now).ok).toBe(true);
    expect(checkForBot({ startedAt: "not a date" }, now).ok).toBe(true);
  });

  it("allows a skewed client clock", () => {
    // A start time in the future means a wrong clock, not a bot.
    const future = new Date(now + 60_000).toISOString();
    expect(checkForBot({ startedAt: future }, now).ok).toBe(true);
  });
});

describe("lead capability tokens", () => {
  /**
   * The token module is server-only, so it is imported dynamically after the
   * signing secret is in place.
   */
  async function loadTokens() {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-signing-secret");
    return import("@/lib/security/lead-token");
  }

  const leadId = "bbbbbbbb-0000-0000-0000-000000000001";

  it("round-trips a lead id", async () => {
    const { issueLeadToken, verifyLeadToken } = await loadTokens();
    const token = issueLeadToken(leadId);
    expect(verifyLeadToken(token)).toEqual({ valid: true, leadId });
  });

  it("rejects a tampered lead id", async () => {
    const { issueLeadToken, verifyLeadToken } = await loadTokens();
    const token = issueLeadToken(leadId);
    const [, expiry, signature] = token.split(".");
    const forged = `bbbbbbbb-0000-0000-0000-000000000002.${expiry}.${signature}`;
    expect(verifyLeadToken(forged)).toEqual({ valid: false, reason: "bad_signature" });
  });

  it("rejects a tampered expiry", async () => {
    const { issueLeadToken, verifyLeadToken } = await loadTokens();
    const token = issueLeadToken(leadId);
    const [id, , signature] = token.split(".");
    const forged = `${id}.${Date.now() + 10_000_000}.${signature}`;
    expect(verifyLeadToken(forged)).toEqual({ valid: false, reason: "bad_signature" });
  });

  it("rejects an expired token", async () => {
    const { issueLeadToken, verifyLeadToken } = await loadTokens();
    const issuedAt = new Date("2026-03-10T00:00:00.000Z");
    const token = issueLeadToken(leadId, issuedAt);
    const muchLater = new Date("2026-03-11T00:00:00.000Z");
    expect(verifyLeadToken(token, muchLater)).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects malformed input rather than throwing", async () => {
    const { verifyLeadToken } = await loadTokens();
    for (const bad of ["", "nonsense", "a.b", "a.b.c.d"]) {
      expect(verifyLeadToken(bad).valid, `input: ${bad}`).toBe(false);
    }
  });

  it("does not accept a signature of a different length", async () => {
    const { issueLeadToken, verifyLeadToken } = await loadTokens();
    const token = issueLeadToken(leadId);
    const [id, expiry] = token.split(".");
    expect(verifyLeadToken(`${id}.${expiry}.short`).valid).toBe(false);
  });
});
