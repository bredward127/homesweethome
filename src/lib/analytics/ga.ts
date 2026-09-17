/**
 * GA4 event tracking.
 *
 * Hard rule: nothing that identifies a person may be passed through here.
 * `sanitizeParams` drops any key that looks like PII as a last line of
 * defence, but callers are expected not to send it in the first place.
 */

import { publicEnv, isAnalyticsConfigured } from "@/lib/env";

/** Event names the funnel and site are allowed to emit. */
export type GaEventName =
  | "funnel_started"
  | "funnel_step_viewed"
  | "funnel_step_completed"
  | "funnel_abandoned"
  | "lead_contact_details_started"
  | "lead_submitted"
  | "lead_qualified"
  | "booking_widget_viewed"
  | "booking_started"
  | "booking_completed"
  | "request_call_clicked"
  | "thank_you_viewed";

export type GaParams = Record<string, string | number | boolean | undefined>;

/**
 * Parameter keys that must never reach GA4. Matched as substrings so
 * `seller_email`, `emailAddress`, and `email` are all caught.
 */
const BLOCKED_PARAM_PATTERNS = [
  "email",
  "phone",
  "name",
  "address",
  "street",
  "zip",
  "postal",
  "lat",
  "lng",
  "payoff",
  "balance",
  "mortgage",
  "note",
  "contract",
  "score",
  "ip",
];

function isBlockedKey(key: string) {
  const lower = key.toLowerCase();
  // `landing_page` and `campaign_name` are legitimate; only block on the
  // standalone PII-ish tokens.
  if (lower === "landing_page" || lower === "campaign" || lower === "page_path") return false;
  return BLOCKED_PARAM_PATTERNS.some((pattern) => lower.includes(pattern));
}

/** Strip disallowed keys and undefined values before an event is sent. */
export function sanitizeParams(params: GaParams = {}): GaParams {
  const safe: GaParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (isBlockedKey(key)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[analytics] dropped potentially identifying parameter "${key}"`);
      }
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

type GtagFn = (command: string, ...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof candidate === "function" ? candidate : null;
}

/**
 * Send a GA4 event. A no-op when GA is not configured or the script has not
 * loaded, so analytics never blocks or breaks a user flow.
 */
export function trackEvent(name: GaEventName, params: GaParams = {}): void {
  const safe = sanitizeParams(params);
  const gtag = getGtag();

  if (!isAnalyticsConfigured || !gtag) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics] (not sent)", name, safe);
    }
    return;
  }
  gtag("event", name, safe);
}

/** Send a manual page_view, for funnel steps that do not change the URL. */
export function trackPageView(path: string, title?: string): void {
  const gtag = getGtag();
  if (!isAnalyticsConfigured || !gtag) return;
  gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: `${publicEnv.appUrl}${path}`,
  });
}
