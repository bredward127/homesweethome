/**
 * Default service areas for the Metro Detroit market.
 *
 * These seed the `service_areas` table and act as the fallback when the
 * database is unavailable. An admin edits the live list in
 * /app/settings/service-areas; nothing here is hard-coded into the scoring
 * logic, which reads service areas from the database at scoring time.
 */
export type ServiceArea = {
  /** Stable slug used in URLs and seed data. */
  slug: string;
  city: string;
  county: string;
  state: string;
  /** ZIP codes treated as in-area for lead scoring. */
  postalCodes: string[];
  /** Whether the area is currently being worked. */
  active: boolean;
};

export const defaultServiceAreas: ServiceArea[] = [
  { slug: "royal-oak", city: "Royal Oak", county: "Oakland", state: "MI", postalCodes: ["48067", "48073"], active: true },
  { slug: "ferndale", city: "Ferndale", county: "Oakland", state: "MI", postalCodes: ["48220"], active: true },
  { slug: "berkley", city: "Berkley", county: "Oakland", state: "MI", postalCodes: ["48072"], active: true },
  { slug: "oak-park", city: "Oak Park", county: "Oakland", state: "MI", postalCodes: ["48237"], active: true },
  { slug: "madison-heights", city: "Madison Heights", county: "Oakland", state: "MI", postalCodes: ["48071"], active: true },
  { slug: "clawson", city: "Clawson", county: "Oakland", state: "MI", postalCodes: ["48017"], active: true },
  { slug: "troy", city: "Troy", county: "Oakland", state: "MI", postalCodes: ["48083", "48084", "48085", "48098"], active: true },
  { slug: "warren", city: "Warren", county: "Macomb", state: "MI", postalCodes: ["48088", "48089", "48091", "48092", "48093"], active: true },
  { slug: "sterling-heights", city: "Sterling Heights", county: "Macomb", state: "MI", postalCodes: ["48310", "48312", "48313", "48314"], active: true },
  { slug: "roseville", city: "Roseville", county: "Macomb", state: "MI", postalCodes: ["48066"], active: true },
  { slug: "st-clair-shores", city: "St. Clair Shores", county: "Macomb", state: "MI", postalCodes: ["48080", "48081", "48082"], active: true },
  { slug: "eastpointe", city: "Eastpointe", county: "Macomb", state: "MI", postalCodes: ["48021"], active: true },
  { slug: "detroit", city: "Detroit", county: "Wayne", state: "MI", postalCodes: ["48201", "48202", "48203", "48204", "48205", "48206", "48207", "48209", "48210", "48212", "48213", "48214", "48219", "48221", "48223", "48224", "48227", "48228", "48234", "48235", "48238"], active: true },
  { slug: "dearborn", city: "Dearborn", county: "Wayne", state: "MI", postalCodes: ["48124", "48126", "48128"], active: true },
  { slug: "redford", city: "Redford", county: "Wayne", state: "MI", postalCodes: ["48239", "48240"], active: true },
  { slug: "livonia", city: "Livonia", county: "Wayne", state: "MI", postalCodes: ["48150", "48152", "48154"], active: true },
  { slug: "southfield", city: "Southfield", county: "Oakland", state: "MI", postalCodes: ["48033", "48034", "48075", "48076"], active: true },
  { slug: "hazel-park", city: "Hazel Park", county: "Oakland", state: "MI", postalCodes: ["48030"], active: true },
];

/** Counties grouped for display on /areas-we-serve. */
export function groupServiceAreasByCounty(areas: ServiceArea[] = defaultServiceAreas) {
  const groups = new Map<string, ServiceArea[]>();
  for (const area of areas) {
    if (!area.active) continue;
    const existing = groups.get(area.county);
    if (existing) existing.push(area);
    else groups.set(area.county, [area]);
  }
  return [...groups.entries()]
    .map(([county, items]) => ({
      county,
      areas: [...items].sort((a, b) => a.city.localeCompare(b.city)),
    }))
    .sort((a, b) => a.county.localeCompare(b.county));
}
