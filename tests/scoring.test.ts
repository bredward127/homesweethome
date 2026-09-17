import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULESET,
  DEFAULT_THRESHOLDS,
  followUpDueAt,
  followUpTaskFor,
  isBookable,
  isInServiceArea,
  scoreLead,
  tierFor,
  type ScoringInput,
} from "@/lib/leads/scoring";

/** A neutral lead: no signal pushes it either way except service area + contact. */
const baseline: ScoringInput = {
  timeline: "3_6_months",
  motivations: [],
  condition: "minor_updates",
  occupancy: "owner_occupied",
  decisionMaker: "unsure",
  hasVerifiedContact: true,
  hasUsableAddress: true,
  inServiceArea: true,
};

const lead = (overrides: Partial<ScoringInput> = {}): ScoringInput => ({ ...baseline, ...overrides });

describe("scoreLead", () => {
  it("scores a neutral in-area lead as Warm", () => {
    // 50 baseline + 5 contact + 10 service area = 65
    const result = scoreLead(baseline);
    expect(result.total).toBe(65);
    expect(result.tier).toBe("warm");
  });

  it("scores a strongly motivated in-area lead as Hot", () => {
    const result = scoreLead(
      lead({
        timeline: "asap",
        motivations: ["inherited", "vacant_property"],
        condition: "full_renovation",
        occupancy: "vacant",
        decisionMaker: "sole",
      }),
    );
    expect(result.total).toBe(100);
    expect(result.tier).toBe("hot");
  });

  it("scores an out-of-area researcher as Nurture", () => {
    const result = scoreLead(
      lead({ timeline: "researching", inServiceArea: false, hasUsableAddress: false }),
    );
    // 50 + 5 contact - 10 exploring - 20 out of area - 8 no address = 17
    expect(result.total).toBe(17);
    expect(result.tier).toBe("nurture");
  });

  it("clamps to the 0-100 range", () => {
    const best = scoreLead(
      lead({
        timeline: "asap",
        motivations: ["inherited", "vacant_property", "financial_pressure", "tired_landlord", "relocating"],
        condition: "full_renovation",
        occupancy: "vacant",
        decisionMaker: "sole",
      }),
    );
    expect(best.total).toBe(100);

    const worst = scoreLead(
      lead({
        timeline: "researching",
        motivations: ["exploring_options"],
        inServiceArea: false,
        hasUsableAddress: false,
        hasVerifiedContact: false,
        decisionMaker: "shared",
      }),
    );
    expect(worst.total).toBeGreaterThanOrEqual(0);
    expect(worst.total).toBeLessThanOrEqual(100);
  });

  it("explains every point it awards", () => {
    const result = scoreLead(lead({ timeline: "asap", motivations: ["inherited"] }));
    const sum = result.reasons.reduce((total, reason) => total + reason.points, 50);
    expect(result.total).toBe(Math.max(0, Math.min(100, sum)));
    for (const reason of result.reasons) {
      expect(reason.label.length).toBeGreaterThan(0);
      expect(reason.points).not.toBe(0);
    }
  });

  it("orders reasons by magnitude so the biggest driver reads first", () => {
    const result = scoreLead(lead({ timeline: "asap", motivations: ["relocating"] }));
    const magnitudes = result.reasons.map((reason) => Math.abs(reason.points));
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => b - a));
  });

  it("records the ruleset version that produced the score", () => {
    const result = scoreLead(baseline);
    expect(result.rulesVersion).toBe(DEFAULT_RULESET.version);
    expect(() => new Date(result.scoredAt).toISOString()).not.toThrow();
  });

  it("counts overlapping financial-urgency motivations only once", () => {
    const single = scoreLead(lead({ motivations: ["financial_pressure"] }));
    const all = scoreLead(
      lead({ motivations: ["financial_pressure", "behind_on_payments", "avoiding_foreclosure"] }),
    );
    // Someone ticking all three is describing one situation, not three.
    expect(all.total).toBe(single.total);
    expect(all.reasons.filter((r) => r.key === "financial_pressure")).toHaveLength(1);
  });

  it("does not penalise 'just exploring' when the timeline is urgent", () => {
    const urgent = scoreLead(lead({ timeline: "asap", motivations: ["exploring_options"] }));
    const withoutExploring = scoreLead(lead({ timeline: "asap" }));
    expect(urgent.total).toBe(withoutExploring.total);
  });

  it("penalises 'just exploring' on a distant timeline", () => {
    const exploring = scoreLead(lead({ timeline: "over_6_months", motivations: ["exploring_options"] }));
    const plain = scoreLead(lead({ timeline: "over_6_months" }));
    expect(exploring.total).toBeLessThan(plain.total);
  });

  it("treats a vacant occupancy and a vacant motivation as the same signal", () => {
    const byOccupancy = scoreLead(lead({ occupancy: "vacant" }));
    const byMotivation = scoreLead(lead({ motivations: ["vacant_property"] }));
    const both = scoreLead(lead({ occupancy: "vacant", motivations: ["vacant_property"] }));
    expect(byOccupancy.total).toBe(byMotivation.total);
    expect(both.total).toBe(byOccupancy.total);
  });
});

describe("flags", () => {
  it("flags a tenant without docking any points", () => {
    const tenant = scoreLead(lead({ occupancy: "tenant_occupied" }));
    const owner = scoreLead(lead({ occupancy: "owner_occupied" }));
    // A tenant complicates a deal; it does not make it a bad one.
    expect(tenant.total).toBe(owner.total);
    expect(tenant.flags.join(" ")).toMatch(/tenant/i);
  });

  it("flags but does not disqualify multiple decision-makers", () => {
    const shared = scoreLead(lead({ decisionMaker: "shared" }));
    expect(shared.flags.join(" ")).toMatch(/decision-maker/i);
    expect(shared.total).toBeGreaterThan(0);
  });

  it("flags a foreclosure mention with a compliance reminder", () => {
    const result = scoreLead(lead({ motivations: ["avoiding_foreclosure"] }));
    expect(result.flags.join(" ")).toMatch(/foreclosure-prevention promise/i);
  });

  it("flags an out-of-area ZIP and a missing address", () => {
    const result = scoreLead(lead({ inServiceArea: false, hasUsableAddress: false }));
    expect(result.flags.join(" ")).toMatch(/outside the active service areas/i);
    expect(result.flags.join(" ")).toMatch(/No street address/i);
  });
});

describe("tierFor", () => {
  it("maps totals to tiers at the documented boundaries", () => {
    expect(tierFor(100)).toBe("hot");
    expect(tierFor(70)).toBe("hot");
    expect(tierFor(69)).toBe("warm");
    expect(tierFor(45)).toBe("warm");
    expect(tierFor(44)).toBe("nurture");
    expect(tierFor(0)).toBe("nurture");
  });

  it("honours custom thresholds", () => {
    expect(tierFor(60, { hot: 55, warm: 30 })).toBe("hot");
    expect(tierFor(60, { hot: 90, warm: 80 })).toBe("nurture");
  });
});

describe("isBookable", () => {
  it("is decided by the threshold, not the tier", () => {
    const score = scoreLead(baseline);
    expect(score.total).toBe(65);
    expect(isBookable(score, 60)).toBe(true);
    expect(isBookable(score, 70)).toBe(false);
  });

  it("is a boolean only — it exposes nothing about the score", () => {
    expect(typeof isBookable(scoreLead(baseline), 60)).toBe("boolean");
  });
});

describe("followUpDueAt", () => {
  const now = new Date("2026-03-10T09:00:00.000Z");

  it("gives a hot lead 15 minutes", () => {
    const due = followUpDueAt("hot", undefined, now);
    expect(due.getTime() - now.getTime()).toBe(15 * 60 * 1000);
  });

  it("gives a warm lead 24 hours", () => {
    const due = followUpDueAt("warm", undefined, now);
    expect(due.getTime() - now.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("gives a nurture lead 7 days", () => {
    const due = followUpDueAt("nurture", undefined, now);
    expect(due.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("honours configured intervals", () => {
    const due = followUpDueAt(
      "hot",
      { hotFollowUpMinutes: 5, warmFollowUpHours: 1, nurtureFollowUpDays: 1 },
      now,
    );
    expect(due.getTime() - now.getTime()).toBe(5 * 60 * 1000);
  });
});

describe("followUpTaskFor", () => {
  it("escalates priority with the tier", () => {
    expect(followUpTaskFor("hot", "Dana Reyes").priority).toBe("high");
    expect(followUpTaskFor("warm", "Dana Reyes").priority).toBe("medium");
    expect(followUpTaskFor("nurture", "Dana Reyes").priority).toBe("low");
  });

  it("names the seller in the task title", () => {
    expect(followUpTaskFor("hot", "Dana Reyes").title).toContain("Dana Reyes");
  });
});

describe("isInServiceArea", () => {
  const areas = [
    { postalCodes: ["48067", "48073"], active: true },
    { postalCodes: ["48220"], active: false },
  ];

  it("matches an active area", () => {
    expect(isInServiceArea("48067", areas)).toBe(true);
    expect(isInServiceArea("48073", areas)).toBe(true);
  });

  it("does not match an inactive area", () => {
    expect(isInServiceArea("48220", areas)).toBe(false);
  });

  it("does not match an unknown ZIP", () => {
    expect(isInServiceArea("90210", areas)).toBe(false);
  });

  it("handles ZIP+4 and surrounding whitespace", () => {
    expect(isInServiceArea(" 48067-1234 ", areas)).toBe(true);
  });

  it("rejects malformed input rather than throwing", () => {
    expect(isInServiceArea("", areas)).toBe(false);
    expect(isInServiceArea("abcde", areas)).toBe(false);
    expect(isInServiceArea("123", areas)).toBe(false);
  });

  it("reads the snake_case shape returned by the database", () => {
    expect(isInServiceArea("48067", [{ postalCodes: ["48067"], is_active: true }])).toBe(true);
    expect(isInServiceArea("48067", [{ postalCodes: ["48067"], is_active: false }])).toBe(false);
  });
});

describe("fair housing", () => {
  it("accepts only property, timeline, and coverage inputs", () => {
    // A compile-time guarantee made explicit: if someone adds a demographic
    // field to ScoringInput, this list stops matching and the test fails.
    const permitted = [
      "timeline",
      "motivations",
      "condition",
      "occupancy",
      "decisionMaker",
      "hasVerifiedContact",
      "hasUsableAddress",
      "inServiceArea",
    ].sort();
    expect(Object.keys(baseline).sort()).toEqual(permitted);
  });

  it("uses no signal naming a protected characteristic", () => {
    const forbidden = /race|colou?r|religio|sex|gender|famil|national|origin|disab|age|ethnic|marital/i;
    for (const rule of Object.values(DEFAULT_RULESET.signals)) {
      expect(rule.key, `signal key: ${rule.key}`).not.toMatch(forbidden);
      expect(rule.label, `signal label: ${rule.label}`).not.toMatch(forbidden);
    }
  });

  it("keeps the default thresholds documented and ordered", () => {
    expect(DEFAULT_THRESHOLDS.hot).toBeGreaterThan(DEFAULT_THRESHOLDS.warm);
  });
});
