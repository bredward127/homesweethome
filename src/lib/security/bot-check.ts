/**
 * Bot mitigation for the public lead form.
 *
 * Two cheap, accessible signals. Neither is a CAPTCHA: a homeowner in a
 * difficult situation should not have to solve a puzzle to reach us, and a
 * CAPTCHA would exclude some people entirely.
 */

/** How quickly a submission is assumed to be automated. */
export const MIN_FORM_DURATION_MS = 3000;

export type BotCheckInput = {
  /** The hidden honeypot field's value. Any content means a bot. */
  honeypot?: string | null;
  /** ISO timestamp recorded when the funnel started. */
  startedAt?: string | null;
};

export type BotCheckResult =
  | { ok: true }
  | { ok: false; reason: "honeypot" | "too_fast" };

/**
 * Evaluate a submission.
 *
 * A failure is reported to the caller but never explained to the submitter —
 * telling a bot *why* it was rejected just helps it adapt. The caller shows a
 * generic message.
 *
 * `startedAt` is client-supplied and therefore forgeable. It is treated as a
 * weak signal only: a missing or unparseable value is allowed through rather
 * than blocking a legitimate person whose clock or storage misbehaved.
 */
export function checkForBot(
  { honeypot, startedAt }: BotCheckInput,
  now: number = Date.now(),
): BotCheckResult {
  if (honeypot && honeypot.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }

  if (startedAt) {
    const started = Date.parse(startedAt);
    if (!Number.isNaN(started)) {
      const elapsed = now - started;
      // Only a positive, implausibly short duration is suspicious. A negative
      // elapsed time means a skewed client clock, not a bot.
      if (elapsed >= 0 && elapsed < MIN_FORM_DURATION_MS) {
        return { ok: false, reason: "too_fast" };
      }
    }
  }

  return { ok: true };
}

/** The honeypot field's name. Plausible enough that a bot will want to fill it. */
export const HONEYPOT_FIELD_NAME = "company_website";
