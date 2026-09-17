"use client";

import * as React from "react";
import type {
  ConditionInput,
  ContactDetailsInput,
  PropertyAddressInput,
  PropertyBasicsInput,
  SituationInput,
  TimelineInput,
} from "@/lib/validation/funnel";
import { captureAttribution, clearAttribution, getAttribution } from "@/lib/leads/attribution";

/**
 * Funnel draft state.
 *
 * Answers are held in memory and mirrored to localStorage so a refresh, a
 * dropped connection, or a phone call mid-form does not lose someone's
 * progress.
 *
 * Nothing is sent to the server until the homeowner reaches the contact step
 * and consents. Before that point we have not been invited to keep anything,
 * so the draft lives only on their own device.
 */

const STORAGE_KEY = "hsh.funnel.v1";

/** Drafts older than this are discarded as stale. */
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type FunnelDraft = {
  address?: Partial<PropertyAddressInput>;
  basics?: Partial<PropertyBasicsInput>;
  condition?: Partial<ConditionInput>;
  situation?: Partial<SituationInput>;
  timeline?: Partial<TimelineInput>;
  /**
   * Contact details are held in the same place for the review step. They are
   * cleared from storage as soon as the lead is submitted.
   */
  contact?: Partial<ContactDetailsInput>;
};

type StoredDraft = {
  draft: FunnelDraft;
  startedAt: string;
  savedAt: string;
};

type FunnelContextValue = {
  draft: FunnelDraft;
  /** ISO timestamp of when this funnel journey began. */
  startedAt: string;
  /** True once the draft has been read from storage, avoiding a flash of empty fields. */
  hydrated: boolean;
  /** Merge a step's answers into the draft. */
  update: <K extends keyof FunnelDraft>(step: K, value: FunnelDraft[K]) => void;
  /** Wipe the draft and stored attribution after a successful submission. */
  reset: () => void;
};

const FunnelContext = React.createContext<FunnelContextValue | null>(null);

function readStored(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.draft || typeof parsed.draft !== "object") return null;

    // Discard a stale draft rather than showing someone week-old answers.
    const savedAt = Date.parse(parsed.savedAt);
    if (!Number.isNaN(savedAt) && Date.now() - savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    // Private browsing, disabled storage, or corrupt JSON — start fresh.
    return null;
  }
}

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<FunnelDraft>({});
  const [startedAt, setStartedAt] = React.useState<string>(() => new Date().toISOString());
  const [hydrated, setHydrated] = React.useState(false);

  /*
   * Hydrate after mount so server and client render identical markup.
   *
   * react-hooks/set-state-in-effect is disabled here deliberately. The draft
   * is state React both owns and writes, so useSyncExternalStore (the usual
   * alternative) does not fit: its getSnapshot must return a cached, stable
   * reference, which a value we mutate on every keystroke cannot.
   *
   * Reading localStorage in the useState initializer is not an option either
   * — the server has no localStorage, so the initial client render would
   * diverge from the server HTML and break hydration.
   *
   * That leaves exactly one render-cascade on mount, which is the accepted
   * cost of client-only persisted state.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const stored = readStored();
    if (stored) {
      setDraft(stored.draft);
      setStartedAt(stored.startedAt);
    }
    setHydrated(true);
    captureAttribution();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist on every change, once hydrated.
  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      // An empty draft means either a fresh visit or a completed submission
      // that called reset(). Writing it back would leave a stale record behind
      // and undo the clear, so remove the key instead.
      if (Object.keys(draft).length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const payload: StoredDraft = { draft, startedAt, savedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage full or unavailable. Autosave is a convenience, not a
      // requirement — the in-memory draft still works for this session.
    }
  }, [draft, startedAt, hydrated]);

  const update = React.useCallback<FunnelContextValue["update"]>((step, value) => {
    setDraft((current) => ({ ...current, [step]: { ...current[step], ...value } }));
  }, []);

  const reset = React.useCallback(() => {
    setDraft({});
    setStartedAt(new Date().toISOString());
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore.
      }
    }
    clearAttribution();
  }, []);

  const value = React.useMemo<FunnelContextValue>(
    () => ({ draft, startedAt, hydrated, update, reset }),
    [draft, startedAt, hydrated, update, reset],
  );

  return <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>;
}

export function useFunnel() {
  const context = React.useContext(FunnelContext);
  if (!context) throw new Error("useFunnel must be used inside <FunnelProvider>.");
  return context;
}

/** Read the stored attribution for submission. */
export function useAttribution() {
  return React.useCallback(() => getAttribution(), []);
}
