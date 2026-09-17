"use client";

import { useSyncExternalStore } from "react";

/**
 * The handoff between the review step and the booking / thank-you screens.
 *
 * Kept in sessionStorage rather than a URL parameter or a server lookup:
 * putting a lead ID in the address bar invites tampering and leaks into
 * referrers and browser history, and a public endpoint that reads a lead by ID
 * would be a hole regardless of how carefully it was written.
 *
 * The token here is a short-lived, HMAC-signed capability that only permits
 * attaching an appointment request to this one lead.
 */

const STORAGE_KEY = "hsh.submission.v1";

export type SubmissionResult = {
  reference: string;
  firstName: string;
  bookable: boolean;
  token: string | null;
  demoMode: boolean;
  submittedAt: string;
};

export function storeSubmissionResult(result: Omit<SubmissionResult, "submittedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: SubmissionResult = { ...result, submittedAt: new Date().toISOString() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    cachedResult = payload;
  } catch {
    // Storage unavailable. The booking screen falls back to asking the
    // homeowner to call, which still gets them to a person.
  }
}

export function readSubmissionResult(): SubmissionResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubmissionResult;
    return parsed?.reference ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSubmissionResult() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedResult = null;
  } catch {
    // Ignore.
  }
}

/**
 * Module-level cache so `getSnapshot` returns a stable reference.
 *
 * `undefined` means "not read yet"; `null` means "read, and there was
 * nothing there".
 */
let cachedResult: SubmissionResult | null | undefined;

function getSnapshot(): SubmissionResult | null {
  if (cachedResult === undefined) cachedResult = readSubmissionResult();
  return cachedResult;
}

/** The value is written before navigation and never changes while mounted. */
function subscribe(): () => void {
  return () => {};
}

/** Server render has no sessionStorage, so there is nothing to report. */
function getServerSnapshot(): SubmissionResult | null {
  return null;
}

/** Invalidate the cache, so the next read hits storage again. */
export function invalidateSubmissionResultCache() {
  cachedResult = undefined;
}

/**
 * Read the submission result in a component.
 *
 * Uses `useSyncExternalStore` rather than an effect: this is external,
 * read-once client state, and the hook handles the server/client snapshot
 * difference without a cascading re-render on mount.
 */
export function useSubmissionResult(): SubmissionResult | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
