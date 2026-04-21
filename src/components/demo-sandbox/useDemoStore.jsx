import { useSyncExternalStore } from 'react';
import {
  SUBMISSIONS, ASSIGNMENTS, CLASSES, STUDENT_GRADES,
} from './mockSchoolData';

/**
 * Demo sandbox local state store.
 *
 * Design goals:
 * - Persists across route navigations within the demo so actions feel real:
 *   a teacher grades, the student & parent see the grade and averages shift.
 * - Resets on page reload (sessionStorage) — refreshing returns the demo to
 *   its pristine seed state.
 * - Pure client-side overlay on top of the static mock data; the underlying
 *   mock arrays are never mutated.
 */

const STORAGE_KEY = 'scholr_demo_state_v1';

const emptyState = {
  // submissionId -> { status, submittedAt, result, feedback }
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
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useDemoStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ─────────────────────────────────────────────────────────────────────────────
// Writes
// ─────────────────────────────────────────────────────────────────────────────

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

/** A student submits work — flips an in_progress/not_started sub to submitted. */
export function submitDemoAssignment(submissionId) {
  setState((s) => ({
    ...s,
    submissions: {
      ...s.submissions,
      [submissionId]: {
        ...(s.submissions[submissionId] || {}),
        status: 'submitted',
        submittedAt: 'just now',
      },
    },
  }));
}

export function resetDemoStore() {
  setState(emptyState);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

export function getDemoSubmissionOverride(submissionId) {
  return state.submissions[submissionId] || null;
}

/**
 * Returns the effective submission (baseline merged with local overrides).
 * Safe to treat as the original shape — { id, status, submittedAt, ... }.
 */
export function getEffectiveSubmission(submission) {
  if (!submission) return null;
  const override = state.submissions[submission.id];
  if (!override) return submission;
  return {
    ...submission,
    status: override.status || submission.status,
    submittedAt: override.submittedAt || submission.submittedAt,
  };
}

export function getEffectiveSubmissionStatus(submission) {
  if (!submission) return 'not_started';
  const override = state.submissions[submission.id];
  return override?.status || submission.status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived — grade averages that incorporate locally-published grades
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the student's effective current grade for a subject (IB 1–7).
 * Blends the baseline term grade with any newly-published grades from demo
 * actions so averages visibly shift after grading.
 *
 * Weighting: baseline acts as one "anchor" sample; each new published grade
 * in the subject counts equally. This keeps one new grade from wildly swinging
 * the whole subject average while still making the impact visible.
 */
export function getEffectiveSubjectGrade(studentId, subjectId, baseline) {
  // Find classes this student is in for the subject, then collect any
  // published grades on this student's submissions in those classes.
  const classesForSubject = CLASSES.filter(
    (c) => c.subjectId === subjectId && c.studentIds.includes(studentId)
  );
  const assignmentIds = new Set(
    ASSIGNMENTS
      .filter((a) => classesForSubject.some((c) => c.id === a.classId))
      .map((a) => a.id)
  );
  const mySubmissions = SUBMISSIONS.filter(
    (s) => s.studentId === studentId && assignmentIds.has(s.assignmentId)
  );

  const publishedGrades = mySubmissions
    .map((s) => state.submissions[s.id]?.result?.ibGrade)
    .filter((g) => typeof g === 'number');

  if (publishedGrades.length === 0) return baseline;

  const samples = [baseline, ...publishedGrades];
  const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Same shape as mockSchoolData.getGradesForStudent, but current grades are
 * blended with locally-published grades so averages respond to teacher action.
 */
export function getEffectiveGradesForStudent(studentId, baselineGrades) {
  return baselineGrades.map((g) => {
    const effective = getEffectiveSubjectGrade(studentId, g.subjectId, g.current);
    return {
      ...g,
      current: effective,
      // Flag so UI can surface the change if desired.
      _adjusted: effective !== g.current,
    };
  });
}

/** Convenience: count locally-published grades for a student. */
export function getPublishedGradeCount(studentId) {
  const myIds = SUBMISSIONS.filter((s) => s.studentId === studentId).map((s) => s.id);
  return myIds.filter((id) => state.submissions[id]?.result).length;
}

// Lightweight no-op reference so tree-shakers keep STUDENT_GRADES linked if
// downstream consumers import this module (prevents accidental removal).
export const _baselineGradesRef = STUDENT_GRADES;