"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { useFunnel, type FunnelDraft } from "@/components/funnel/funnel-provider";
import { stepHref, type FunnelStepId } from "@/lib/leads/funnel-steps";
import { trackEvent } from "@/lib/analytics/ga";

/**
 * Wires a funnel step to its Zod schema, the shared draft, and navigation.
 *
 * Validation happens on submit rather than on every keystroke: correcting
 * someone's phone number while they are still typing it is hostile, and error
 * text that appears and vanishes is worse than none.
 */
export function useStepForm<S extends z.ZodType>({
  step,
  draftKey,
  schema,
  next,
}: {
  step: FunnelStepId;
  draftKey: keyof FunnelDraft;
  schema: S;
  /** The step to advance to on success. */
  next: FunnelStepId;
}) {
  const router = useRouter();
  const { draft, update } = useFunnel();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Memoized so `submit` is not rebuilt on every render.
  const values = React.useMemo(
    () => (draft[draftKey] ?? {}) as Record<string, unknown>,
    [draft, draftKey],
  );

  /** Merge a partial answer into the draft and clear that field's error. */
  const setValue = React.useCallback(
    (patch: Record<string, unknown>) => {
      update(draftKey, patch as FunnelDraft[typeof draftKey]);
      setErrors((current) => {
        const remaining = { ...current };
        for (const key of Object.keys(patch)) delete remaining[key];
        return remaining;
      });
    },
    [draftKey, update],
  );

  const submit = React.useCallback(() => {
    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);

      // Move focus to the first thing that needs attention.
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey && typeof document !== "undefined") {
        const target = document.querySelector<HTMLElement>(
          `[name="${firstKey}"], #${CSS.escape(firstKey)}`,
        );
        target?.focus();
      }
      return;
    }

    setErrors({});
    trackEvent("funnel_step_completed", { funnel_step: step });
    router.push(stepHref(next));
  }, [schema, values, step, next, router]);

  return { values, errors, setValue, submit, setErrors };
}
