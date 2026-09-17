import { describe, expect, it } from "vitest";
import { defaultServiceAreas, groupServiceAreasByCounty } from "@/config/service-areas";

describe("default service areas", () => {
  it("uses unique slugs", () => {
    const slugs = defaultServiceAreas.map((area) => area.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("covers Michigan only, with at least one ZIP each", () => {
    for (const area of defaultServiceAreas) {
      expect(area.state).toBe("MI");
      expect(area.postalCodes.length).toBeGreaterThan(0);
      for (const zip of area.postalCodes) expect(zip).toMatch(/^\d{5}$/);
    }
  });

  it("does not reuse a ZIP code across two areas", () => {
    const seen = new Map<string, string>();
    for (const area of defaultServiceAreas) {
      for (const zip of area.postalCodes) {
        expect(seen.has(zip), `${zip} appears in both ${seen.get(zip)} and ${area.slug}`).toBe(
          false,
        );
        seen.set(zip, area.slug);
      }
    }
  });
});

describe("groupServiceAreasByCounty", () => {
  it("groups active areas by county, sorted", () => {
    const groups = groupServiceAreasByCounty();
    expect(groups.map((group) => group.county)).toEqual(["Macomb", "Oakland", "Wayne"]);
    for (const group of groups) {
      const cities = group.areas.map((area) => area.city);
      expect(cities).toEqual([...cities].sort((a, b) => a.localeCompare(b)));
    }
  });

  it("omits inactive areas", () => {
    const groups = groupServiceAreasByCounty([
      { slug: "a", city: "Alpha", county: "Oakland", state: "MI", postalCodes: ["48000"], active: true },
      { slug: "b", city: "Beta", county: "Oakland", state: "MI", postalCodes: ["48001"], active: false },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].areas.map((area) => area.city)).toEqual(["Alpha"]);
  });
});
