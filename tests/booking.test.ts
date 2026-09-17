import { describe, expect, it, vi, afterEach } from "vitest";

/** The booking module reads the environment at call time, so it is imported fresh per test. */
async function loadBooking(url?: string) {
  vi.resetModules();
  if (url === undefined) vi.stubEnv("CALENDLY_URL", "");
  else vi.stubEnv("CALENDLY_URL", url);
  return import("@/lib/integrations/booking");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getBookingProvider", () => {
  it("falls back to in-app requests when nothing is configured", async () => {
    const { getBookingProvider, isBookingConfigured } = await loadBooking();
    expect(getBookingProvider()).toEqual({ kind: "in_app" });
    expect(isBookingConfigured()).toBe(false);
  });

  it("recognises a Calendly URL", async () => {
    const { getBookingProvider } = await loadBooking("https://calendly.com/hsh/property-call");
    expect(getBookingProvider()).toEqual({
      kind: "calendly",
      url: "https://calendly.com/hsh/property-call",
    });
  });

  it("accepts another https scheduler as a generic provider", async () => {
    const { getBookingProvider } = await loadBooking("https://scheduler.example/book");
    const provider = getBookingProvider();
    expect(provider.kind).toBe("generic");
  });

  it("refuses a non-https URL rather than downgrading the connection", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getBookingProvider } = await loadBooking("http://calendly.com/hsh");
    expect(getBookingProvider()).toEqual({ kind: "in_app" });
  });

  it("refuses a malformed URL rather than crashing the funnel", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getBookingProvider } = await loadBooking("not a url");
    expect(getBookingProvider()).toEqual({ kind: "in_app" });
  });
});

describe("demoAppointmentSlots", () => {
  it("returns the requested number of future slots", async () => {
    const { demoAppointmentSlots } = await loadBooking();
    const now = new Date("2026-03-10T08:00:00.000Z");
    const slots = demoAppointmentSlots(now, 6);
    expect(slots).toHaveLength(6);
    for (const slot of slots) expect(slot.getTime()).toBeGreaterThan(now.getTime());
  });

  it("returns slots in ascending order", async () => {
    const { demoAppointmentSlots } = await loadBooking();
    const slots = demoAppointmentSlots(new Date("2026-03-10T08:00:00.000Z"), 6);
    const times = slots.map((slot) => slot.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("never offers a Sunday, matching published business hours", async () => {
    const { demoAppointmentSlots } = await loadBooking();
    const slots = demoAppointmentSlots(new Date("2026-03-10T08:00:00.000Z"), 6);
    for (const slot of slots) expect(slot.getDay()).not.toBe(0);
  });
});
