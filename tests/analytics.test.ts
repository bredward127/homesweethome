import { describe, expect, it, vi, afterEach } from "vitest";
import { sanitizeParams } from "@/lib/analytics/ga";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sanitizeParams", () => {
  it("keeps non-identifying funnel parameters", () => {
    const result = sanitizeParams({
      funnel_step: 4,
      property_type: "single_family",
      timeline_bucket: "asap",
      source: "google",
      medium: "cpc",
      campaign: "metro-detroit",
      landing_page: "/sell-my-house",
      device_category: "mobile",
    });

    expect(result).toEqual({
      funnel_step: 4,
      property_type: "single_family",
      timeline_bucket: "asap",
      source: "google",
      medium: "cpc",
      campaign: "metro-detroit",
      landing_page: "/sell-my-house",
      device_category: "mobile",
    });
  });

  it.each([
    "email",
    "seller_email",
    "phone",
    "phoneNumber",
    "first_name",
    "full_name",
    "street_address",
    "address",
    "zip",
    "postal_code",
    "estimated_payoff",
    "mortgage_balance",
    "internal_note",
    "contract_id",
    "lead_score",
    "ip_address",
  ])("drops the identifying parameter %s", (key) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(sanitizeParams({ [key]: "value" })).toEqual({});
  });

  it("drops undefined values rather than sending them", () => {
    expect(sanitizeParams({ funnel_step: undefined, source: "direct" })).toEqual({
      source: "direct",
    });
  });

  it("returns an empty object for no params", () => {
    expect(sanitizeParams()).toEqual({});
  });
});
