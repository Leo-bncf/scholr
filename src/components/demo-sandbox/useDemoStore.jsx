import { useSyncExternalStore } from 'react';

/**
 * Demo sandbox local state store.
 *
 * Design goals:
 * - Persists across route navigations within the demo (so a grade "sticks"
 *   when you leave and come back to a submission).
 * - Resets on page reload — we intentionally use sessionStorage so a refresh
 *   brings the demo back to its pristine state.
 * - Pure client-side overlay on top of the static mock data; the underlying
 *   mock arrays are never mutated.
 */

const STORAGE_KEY = 'scholr_demo_state_v1';

const emptyState = {
  // submissionId -> { status, gradedAt, result: {totalScored,totalMax,ibGrade,percent}, feedback: { paragraphId: [text, ...] } }
  submissions: {},
};

function readFromStorage() {
  if (typeof window === 'undefined') return emptyState;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw);
    return { ...emptyState, ...parsed };
  } catch {
    return emptyState;
  }
}

function writeToStorage(state) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private-mode — ignore; in-memory state still works.
  }
}

let state = readFromStorage();
const listeners = new Set();

function setState(updater) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  if (next === state) return;
  state = next;
  writeToStorage(state);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function useDemoStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getDemoSubmissionOverride(submissionId) {
  return state.submissions[submissionId] || null;
}

export function publishDemoGrade(submissionId, result) {
  setState((s) => ({
    ...s,
    submissions: {
      ...s.submissions,
      [submissionId]: {
        ...(s.submissions[submissionId] || {}),
        status: 'graded',
        gradedAt: Date.now(),
        result,
      },
    },
  }));
}

export function saveDemoFeedback(submissionId, feedbackByParagraph) {
  setState((s) => ({
    ...s,
    submissions: {
      ...s.submissions,
      [submissionId]: {
        ...(s.submissions[submissionId] || {}),
        feedback: feedbackByParagraph,
      },
    },
  }));
}

export function resetDemoStore() {
  setState(emptyState);
}

/**
 * Returns the effective status of a submission, combining the mock baseline
 * with any local overrides (e.g. graded during this demo session).
 */
export function getEffectiveSubmissionStatus(submission) {
  if (!submission) return 'not_started';
  const override = state.submissions[submission.id];
  return override?.status || submission.status;
}