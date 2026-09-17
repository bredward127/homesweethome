import { describe, expect, it } from "vitest";
import {
  FUNNEL_STEPS,
  TOTAL_STEPS,
  backHref,
  nextStep,
  previousStep,
  stepHref,
  stepNumber,
} from "@/lib/leads/funnel-steps";

describe("funnel step model", () => {
  it("has eight steps", () => {
    expect(TOTAL_STEPS).toBe(8);
    expect(FUNNEL_STEPS).toHaveLength(8);
  });

  it("uses unique step ids", () => {
    const ids = FUNNEL_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("numbers steps from one", () => {
    expect(stepNumber("address")).toBe(1);
    expect(stepNumber("basics")).toBe(2);
    expect(stepNumber("booking")).toBe(8);
  });

  it("keeps the two property stages on one route, distinguished by a parameter", () => {
    expect(stepHref("address")).toBe("/sell-my-house/property");
    expect(stepHref("basics")).toBe("/sell-my-house/property?stage=basics");
  });

  it("links every step to a /sell-my-house route", () => {
    for (const step of FUNNEL_STEPS) {
      expect(step.path.startsWith("/sell-my-house/"), step.id).toBe(true);
    }
  });

  it("walks forwards and backwards consistently", () => {
    for (const [index, step] of FUNNEL_STEPS.entries()) {
      const forward = nextStep(step.id);
      if (index === FUNNEL_STEPS.length - 1) {
        expect(forward).toBeNull();
      } else {
        expect(forward).toBe(FUNNEL_STEPS[index + 1].id);
        expect(previousStep(forward!)).toBe(step.id);
      }
    }
  });

  it("has no step before the first", () => {
    expect(previousStep("address")).toBeNull();
  });

  it("sends Back from the first step to the intro screen", () => {
    expect(backHref("address")).toBe("/sell-my-house/start");
  });

  it("sends Back from a later step to the previous one", () => {
    expect(backHref("basics")).toBe("/sell-my-house/property");
    expect(backHref("condition")).toBe("/sell-my-house/property?stage=basics");
    expect(backHref("review")).toBe("/sell-my-house/contact-details");
  });
});
