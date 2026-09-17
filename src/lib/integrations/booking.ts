import "server-only";

import { serverEnv } from "@/lib/env.server";

/**
 * Booking provider abstraction.
 *
 * The funnel asks this module what booking looks like rather than knowing
 * about any particular scheduler, so swapping Calendly for something else is a
 * change here and nowhere else.
 *
 * When nothing is configured, booking falls back to an in-app appointment
 * request that creates a task in the CRM. A homeowner is never told "booking
 * is unavailable" — the team simply calls them instead.
 */

export type BookingProvider =
  | { kind: "calendly"; url: string }
  | { kind: "generic"; url: string }
  | { kind: "in_app" };

/** Resolve the configured provider. Server-only: reads the environment. */
export function getBookingProvider(): BookingProvider {
  const url = serverEnv.calendlyUrl;
  if (!url) return { kind: "in_app" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.error("[booking] CALENDLY_URL is not a valid URL; falling back to in-app requests.");
    return { kind: "in_app" };
  }

  // Only ever embed or redirect to https, so a misconfiguration cannot
  // downgrade a homeowner's connection.
  if (parsed.protocol !== "https:") {
    console.error("[booking] Booking URL must use https; falling back to in-app requests.");
    return { kind: "in_app" };
  }

  if (parsed.hostname.endsWith("calendly.com")) {
    return { kind: "calendly", url: parsed.toString() };
  }
  return { kind: "generic", url: parsed.toString() };
}

/** Whether a real external scheduler is configured. */
export function isBookingConfigured(): boolean {
  return getBookingProvider().kind !== "in_app";
}

/**
 * Demo slots shown when no provider is configured, so the booking step is
 * still demonstrable. Clearly labelled as requests in the UI: choosing one
 * asks the team to confirm, it does not book anything.
 *
 * Generates the next few weekday mornings and afternoons.
 */
export function demoAppointmentSlots(now: Date = new Date(), count = 6): Date[] {
  const slots: Date[] = [];
  const cursor = new Date(now);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(0);

  const HOURS = [10, 14, 17];
  let dayOffset = 1;

  while (slots.length < count && dayOffset < 14) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + dayOffset);
    const weekday = day.getDay();

    // Monday to Saturday only, matching published business hours.
    if (weekday !== 0) {
      for (const hour of HOURS) {
        if (slots.length >= count) break;
        const slot = new Date(day);
        slot.setHours(hour, 0, 0, 0);
        if (slot > now) slots.push(slot);
      }
    }
    dayOffset += 1;
  }

  return slots;
}
