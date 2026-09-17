/**
 * The funnel's step model.
 *
 * Eight steps across seven routes: the property step has two stages (address,
 * then basics) so it keeps the "one primary question per screen" rule while
 * still matching the agreed `/sell-my-house/property` URL. The stage is a
 * query parameter rather than component state so the browser Back button
 * behaves the way a homeowner expects.
 */

export const FUNNEL_STEPS = [
  { id: "address", path: "/sell-my-house/property", stage: null, label: "Property address" },
  { id: "basics", path: "/sell-my-house/property", stage: "basics", label: "Property details" },
  { id: "condition", path: "/sell-my-house/condition", stage: null, label: "Condition" },
  { id: "situation", path: "/sell-my-house/situation", stage: null, label: "Your situation" },
  { id: "timeline", path: "/sell-my-house/timeline", stage: null, label: "Timeline" },
  { id: "contact", path: "/sell-my-house/contact-details", stage: null, label: "Contact details" },
  { id: "review", path: "/sell-my-house/review", stage: null, label: "Review" },
  { id: "booking", path: "/sell-my-house/book-call", stage: null, label: "Next step" },
] as const;

export type FunnelStepId = (typeof FUNNEL_STEPS)[number]["id"];

/** Total steps shown in the progress indicator. */
export const TOTAL_STEPS = FUNNEL_STEPS.length;

/** 1-based position of a step, for "Step N of 8". */
export function stepNumber(id: FunnelStepId): number {
  return FUNNEL_STEPS.findIndex((step) => step.id === id) + 1;
}

/** The href for a step, including its stage parameter where it has one. */
export function stepHref(id: FunnelStepId): string {
  const step = FUNNEL_STEPS.find((candidate) => candidate.id === id);
  if (!step) return FUNNEL_STEPS[0].path;
  return step.stage ? `${step.path}?stage=${step.stage}` : step.path;
}

/** The step before `id`, or null at the start of the funnel. */
export function previousStep(id: FunnelStepId): FunnelStepId | null {
  const index = FUNNEL_STEPS.findIndex((step) => step.id === id);
  return index > 0 ? FUNNEL_STEPS[index - 1].id : null;
}

/** The step after `id`, or null at the end. */
export function nextStep(id: FunnelStepId): FunnelStepId | null {
  const index = FUNNEL_STEPS.findIndex((step) => step.id === id);
  return index >= 0 && index < FUNNEL_STEPS.length - 1 ? FUNNEL_STEPS[index + 1].id : null;
}

/** Where "Back" goes from a step — the intro screen at the very start. */
export function backHref(id: FunnelStepId): string {
  const previous = previousStep(id);
  return previous ? stepHref(previous) : "/sell-my-house/start";
}
