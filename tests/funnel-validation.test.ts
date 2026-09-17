import { describe, expect, it } from "vitest";
import {
  conditionSchema,
  contactDetailsSchema,
  formatPhone,
  leadSubmissionSchema,
  phoneSchema,
  propertyAddressSchema,
  propertyBasicsSchema,
  situationSchema,
  timelineSchema,
  zipSchema,
} from "@/lib/validation/funnel";

describe("phoneSchema", () => {
  it.each([
    ["(248) 555-0134", "2485550134"],
    ["248-555-0134", "2485550134"],
    ["248.555.0134", "2485550134"],
    ["2485550134", "2485550134"],
    ["+1 (248) 555-0134", "2485550134"],
    ["1-248-555-0134", "2485550134"],
    ["  248 555 0134  ", "2485550134"],
  ])("normalises %s to digits", (input, expected) => {
    const result = phoneSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(expected);
  });

  it.each(["", "555-0134", "12345", "248555013456", "not a phone"])(
    "rejects %s",
    (input) => {
      expect(phoneSchema.safeParse(input).success).toBe(false);
    },
  );
});

describe("zipSchema", () => {
  it("accepts 5-digit and ZIP+4", () => {
    expect(zipSchema.safeParse("48067").success).toBe(true);
    expect(zipSchema.safeParse("48067-1234").success).toBe(true);
  });

  it.each(["4806", "480678", "abcde", ""])("rejects %s", (input) => {
    expect(zipSchema.safeParse(input).success).toBe(false);
  });
});

describe("propertyAddressSchema", () => {
  const valid = {
    addressUnknown: false,
    street: "123 Main St",
    city: "Royal Oak",
    state: "Michigan",
    postalCode: "48067",
  };

  it("accepts a complete address", () => {
    expect(propertyAddressSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a street when the address is known", () => {
    const result = propertyAddressSchema.safeParse({ ...valid, street: undefined });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["street"]);
  });

  it("accepts a missing street when the seller ticks 'I don't have the address'", () => {
    const result = propertyAddressSchema.safeParse({
      ...valid,
      street: undefined,
      addressUnknown: true,
      propertyDescription: "Brick ranch near Woodward and 11 Mile.",
    });
    expect(result.success).toBe(true);
  });

  it("requires a description when the address is unavailable", () => {
    const result = propertyAddressSchema.safeParse({
      ...valid,
      street: undefined,
      addressUnknown: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["propertyDescription"]);
  });

  it("always requires city and ZIP", () => {
    expect(propertyAddressSchema.safeParse({ ...valid, city: "" }).success).toBe(false);
    expect(propertyAddressSchema.safeParse({ ...valid, postalCode: "" }).success).toBe(false);
  });

  it("caps free text so a field cannot be used to stuff the database", () => {
    const result = propertyAddressSchema.safeParse({
      ...valid,
      addressUnknown: true,
      street: undefined,
      propertyDescription: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("propertyBasicsSchema", () => {
  it("requires only type and occupancy", () => {
    const result = propertyBasicsSchema.safeParse({
      propertyType: "single_family",
      occupancy: "vacant",
    });
    expect(result.success).toBe(true);
  });

  it("coerces numeric strings from the form", () => {
    const result = propertyBasicsSchema.safeParse({
      propertyType: "single_family",
      occupancy: "vacant",
      bedrooms: "3",
      bathrooms: "1.5",
      squareFeet: "1200",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bedrooms).toBe(3);
      expect(result.data.bathrooms).toBe(1.5);
      expect(result.data.squareFeet).toBe(1200);
    }
  });

  it("rejects implausible values", () => {
    const base = { propertyType: "single_family", occupancy: "vacant" };
    expect(propertyBasicsSchema.safeParse({ ...base, bedrooms: 999 }).success).toBe(false);
    expect(propertyBasicsSchema.safeParse({ ...base, bedrooms: -1 }).success).toBe(false);
    expect(propertyBasicsSchema.safeParse({ ...base, squareFeet: 5 }).success).toBe(false);
    expect(propertyBasicsSchema.safeParse({ ...base, squareFeet: 500000 }).success).toBe(false);
  });

  it("rejects an unknown property type", () => {
    expect(
      propertyBasicsSchema.safeParse({ propertyType: "castle", occupancy: "vacant" }).success,
    ).toBe(false);
  });
});

describe("conditionSchema", () => {
  it("requires a condition but nothing else", () => {
    const result = conditionSchema.safeParse({ condition: "not_sure" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.repairAreas).toEqual([]);
  });

  it("rejects an unknown repair area", () => {
    expect(
      conditionSchema.safeParse({ condition: "not_sure", repairAreas: ["moat"] }).success,
    ).toBe(false);
  });
});

describe("situationSchema", () => {
  it("requires at least one motivation", () => {
    expect(situationSchema.safeParse({ motivations: [] }).success).toBe(false);
    expect(situationSchema.safeParse({ motivations: ["inherited"] }).success).toBe(true);
  });

  it("accepts several motivations", () => {
    const result = situationSchema.safeParse({
      motivations: ["inherited", "repairs_overwhelming", "vacant_property"],
    });
    expect(result.success).toBe(true);
  });

  it("leaves notes genuinely optional", () => {
    const result = situationSchema.safeParse({ motivations: ["inherited"], situationNotes: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.situationNotes).toBeUndefined();
  });
});

describe("timelineSchema", () => {
  const valid = { timeline: "asap", decisionMaker: "sole", mortgageStatus: "no" };

  it("requires timeline, decision-maker, and mortgage status", () => {
    expect(timelineSchema.safeParse(valid).success).toBe(true);
    expect(timelineSchema.safeParse({ ...valid, timeline: undefined }).success).toBe(false);
    expect(timelineSchema.safeParse({ ...valid, decisionMaker: undefined }).success).toBe(false);
    expect(timelineSchema.safeParse({ ...valid, mortgageStatus: undefined }).success).toBe(false);
  });

  it("allows declining to say", () => {
    expect(
      timelineSchema.safeParse({ ...valid, mortgageStatus: "prefer_not_to_say" }).success,
    ).toBe(true);
  });

  it("keeps the payoff range optional", () => {
    expect(timelineSchema.safeParse({ ...valid, mortgageStatus: "yes" }).success).toBe(true);
  });
});

describe("contactDetailsSchema", () => {
  const valid = {
    firstName: "Dana",
    lastName: "Reyes",
    phone: "(248) 555-0134",
    email: "Dana@Example.COM",
    preferredContactMethod: "phone",
    bestTimeToContact: "morning",
    contactConsent: true,
    smsConsent: false,
  };

  it("accepts a complete, consented submission", () => {
    const result = contactDetailsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("dana@example.com");
      expect(result.data.phone).toBe("2485550134");
    }
  });

  it("refuses to proceed without contact consent", () => {
    const result = contactDetailsSchema.safeParse({ ...valid, contactConsent: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "contactConsent")).toBe(true);
    }
  });

  it("keeps SMS consent separate and optional", () => {
    const withoutSms = contactDetailsSchema.safeParse({ ...valid, smsConsent: undefined });
    expect(withoutSms.success).toBe(true);
    if (withoutSms.success) expect(withoutSms.data.smsConsent).toBe(false);

    const withSms = contactDetailsSchema.safeParse({ ...valid, smsConsent: true });
    expect(withSms.success).toBe(true);
    if (withSms.success) expect(withSms.data.smsConsent).toBe(true);
  });

  it("requires a name, phone, and email", () => {
    expect(contactDetailsSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(contactDetailsSchema.safeParse({ ...valid, lastName: "" }).success).toBe(false);
    expect(contactDetailsSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(contactDetailsSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });
});

describe("leadSubmissionSchema", () => {
  const complete = {
    address: {
      addressUnknown: false,
      street: "123 Main St",
      city: "Royal Oak",
      state: "Michigan",
      postalCode: "48067",
    },
    basics: { propertyType: "single_family", occupancy: "vacant" },
    condition: { condition: "major_repairs" },
    situation: { motivations: ["inherited"] },
    timeline: { timeline: "asap", decisionMaker: "sole", mortgageStatus: "no" },
    contact: {
      firstName: "Dana",
      lastName: "Reyes",
      phone: "2485550134",
      email: "dana@example.com",
      preferredContactMethod: "phone",
      bestTimeToContact: "morning",
      contactConsent: true,
    },
  };

  it("accepts a complete submission", () => {
    expect(leadSubmissionSchema.safeParse(complete).success).toBe(true);
  });

  it("rejects a submission whose honeypot was filled in", () => {
    const result = leadSubmissionSchema.safeParse({ ...complete, honeypot: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty honeypot", () => {
    expect(leadSubmissionSchema.safeParse({ ...complete, honeypot: "" }).success).toBe(true);
  });

  it("rejects a submission missing any step", () => {
    for (const key of ["address", "basics", "condition", "situation", "timeline", "contact"]) {
      const partial = { ...complete } as Record<string, unknown>;
      delete partial[key];
      expect(leadSubmissionSchema.safeParse(partial).success, `missing ${key}`).toBe(false);
    }
  });

  it("caps attribution values so a crafted query string cannot flood a column", () => {
    const result = leadSubmissionSchema.safeParse({
      ...complete,
      attribution: { utmSource: "x".repeat(300) },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a submission with no attribution at all", () => {
    const result = leadSubmissionSchema.safeParse(complete);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.attribution).toBeUndefined();
  });
});

describe("formatPhone", () => {
  it("formats a 10-digit number for display", () => {
    expect(formatPhone("2485550134")).toBe("(248) 555-0134");
  });

  it("leaves anything unexpected alone rather than mangling it", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

describe("error messages for fields the user never touched", () => {
  /**
   * A key is absent (not empty-string) when someone skips a field entirely.
   * Zod's default for that case is "Invalid input: expected string, received
   * undefined" — a developer message. On a form that asks about a divorce or
   * a foreclosure, that wording is unacceptable, so every schema is asserted
   * to produce human wording on the empty object.
   */
  it.each([
    ["address", propertyAddressSchema],
    ["basics", propertyBasicsSchema],
    ["condition", conditionSchema],
    ["situation", situationSchema],
    ["timeline", timelineSchema],
    ["contact", contactDetailsSchema],
  ])("uses plain language for every missing field in %s", (_name, schema) => {
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    for (const issue of result.error.issues) {
      expect(issue.message, `${String(issue.path)}: ${issue.message}`).not.toMatch(
        /invalid input|expected .*received|invalid_type|undefined|NaN/i,
      );
      // A real sentence, not a token.
      expect(issue.message.length).toBeGreaterThan(8);
      expect(issue.message).toMatch(/[.!?]$/);
    }
  });
});
