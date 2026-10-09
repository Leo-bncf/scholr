/**
 * ibDiplomaRules.js
 *
 * Official International Baccalaureate (IB) Diploma Programme award regulations.
 * Articles 13 & 14 of the General Regulations: Diploma Programme.
 *
 * Provides pure domain calculation for:
 *   1. The official 3-point TOK/EE Matrix.
 *   2. The formal Diploma Passing Conditions (including 4-HL & 24–27 pt criteria).
 *   3. Candidate diploma status (Failing Condition, Borderline, On Track).
 */

// ── The Official IBO TOK x EE Matrix ─────────────────────────────────────────
// Rows: TOK (A-E), Columns: EE (A-E).
// Grade 'E' in either TOK or EE is an automatic failing condition for the Diploma.
const MATRIX_POINTS = {
  A: { A: 3, B: 3, C: 2, D: 2, E: 0 },
  B: { A: 3, B: 2, C: 1, D: 1, E: 0 },
  C: { A: 2, B: 1, C: 1, D: 0, E: 0 },
  D: { A: 2, B: 1, C: 0, D: 0, E: 0 },
  E: { A: 0, B: 0, C: 0, D: 0, E: 0 },
};

/**
 * Calculates core bonus points (0 to 3) from TOK and EE letter grades.
 * Flags if an E grade was awarded (failing condition).
 */
export function calculateCoreBonus(tokGrade, eeGrade) {
  const tok = (tokGrade || '').toUpperCase();
  const ee = (eeGrade || '').toUpperCase();

  const validGrades = ['A', 'B', 'C', 'D', 'E'];
  const hasTok = validGrades.includes(tok);
  const hasEe = validGrades.includes(ee);

  if (!hasTok && !hasEe) {
    return { bonusPoints: 0, isPending: true, isFailingCondition: false };
  }

  const isFailing = tok === 'E' || ee === 'E';
  const points = (hasTok && hasEe) ? (MATRIX_POINTS[tok]?.[ee] ?? 0) : 0;

  return {
    bonusPoints: isFailing ? 0 : points,
    isPending: !hasTok || !hasEe,
    isFailingCondition: isFailing,
  };
}

/**
 * Evaluates the full IBO Diploma passing criteria for a candidate.
 *
 * @param {Object} input
 * @param {Array}  input.courses - Array of { name, level: 'HL'|'SL', grade: 1-7, isPredicted }
 * @param {string} input.tokGrade - 'A'|'B'|'C'|'D'|'E'
 * @param {string} input.eeGrade  - 'A'|'B'|'C'|'D'|'E'
 * @param {boolean} input.casFulfilled - Has student met CAS requirements
 */
export function evaluateDiplomaConditions({ courses = [], tokGrade, eeGrade, casFulfilled = true }) {
  const core = calculateCoreBonus(tokGrade, eeGrade);

  if (!courses || courses.length === 0) {
    return {
      totalPoints: 0,
      subjectPoints: 0,
      coreBonus: core.bonusPoints,
      isCorePending: core.isPending,
      hlPoints: 0,
      slPoints: 0,
      status: 'mute',
      statusLabel: 'Awaiting Courses',
      conditions: [],
      failedConditions: [],
      criticalCount: 0,
      recommendations: ['Enrolment in Higher Level and Standard Level courses required to evaluate diploma rules.'],
      isEmpty: true,
    };
  }

  const hlCourses = courses.filter(c => (c.level || '').toUpperCase() === 'HL');
  const slCourses = courses.filter(c => (c.level || '').toUpperCase() === 'SL');

  const hlGrades = hlCourses.map(c => Number(c.grade) || 0);
  const slGrades = slCourses.map(c => Number(c.grade) || 0);

  // Article 13: 4 HL candidates require 14 HL points; 3 HL candidates require 12 HL points.
  const isFourHl = hlCourses.length >= 4;
  const hlTarget = isFourHl ? 14 : 12;
  const slTarget = isFourHl ? 5 : 9;

  const hlPoints = hlGrades.reduce((sum, g) => sum + g, 0);
  const slPoints = slGrades.reduce((sum, g) => sum + g, 0);

  const allGrades = courses.map(c => Number(c.grade) || 0);
  const subjectPoints = allGrades.reduce((sum, g) => sum + g, 0);
  const totalPoints = subjectPoints + core.bonusPoints;

  const countOf1s = allGrades.filter(g => g === 1).length;
  const countOf2s = allGrades.filter(g => g === 2).length;
  const countOf3sOrBelow = allGrades.filter(g => g > 0 && g <= 3).length;

  // Article 13: For score 24 to 27, no grade 2 at HL is permitted
  const hlGrade2Count = hlCourses.filter(c => Number(c.grade) === 2).length;
  const hasHlGrade2AtBorderline = (totalPoints >= 24 && totalPoints <= 27) && hlGrade2Count > 0;

  const conditions = [
    {
      id: 'total_points',
      label: 'Minimum 24 Points',
      passed: totalPoints >= 24,
      current: `${totalPoints} / 24`,
      description: 'At least 24 total points must be achieved across subjects and Core.',
      severity: totalPoints < 24 ? 'crit' : 'good',
    },
    {
      id: 'hl_points',
      label: isFourHl ? 'HL Points Threshold (4 HLs)' : 'HL Points Threshold',
      passed: hlPoints >= hlTarget,
      current: `${hlPoints} / ${hlTarget}`,
      description: isFourHl
        ? 'Minimum 14 points across four HL subjects (Article 13.g).'
        : 'Minimum 12 points across three HL subjects (Article 13.g).',
      severity: hlPoints < hlTarget ? 'crit' : hlPoints === hlTarget ? 'warn' : 'good',
    },
    {
      id: 'sl_points',
      label: isFourHl ? 'SL Points Threshold (2 SLs)' : 'SL Points Threshold',
      passed: slCourses.length === 0 || slPoints >= slTarget,
      current: `${slPoints} / ${slTarget}`,
      description: isFourHl
        ? 'Minimum 5 points across two SL subjects.'
        : 'Minimum 9 points across three SL subjects.',
      severity: slPoints < slTarget && slCourses.length > 0 ? 'crit' : slPoints === slTarget ? 'warn' : 'good',
    },
    {
      id: 'no_grade_e_core',
      label: 'Core Grade E Prohibition',
      passed: !core.isFailingCondition,
      current: core.isFailingCondition ? 'Grade E Awarded' : (core.isPending ? 'Pending' : 'Met'),
      description: 'Grade E in either Theory of Knowledge or Extended Essay immediately bars the Diploma.',
      severity: core.isFailingCondition ? 'crit' : 'good',
    },
    {
      id: 'cas_completion',
      label: 'CAS Completion',
      passed: casFulfilled,
      current: casFulfilled ? 'Completed' : 'Incomplete',
      description: 'All CAS learning outcomes and reflections must be formally verified.',
      severity: !casFulfilled ? 'warn' : 'good',
    },
    {
      id: 'no_grade_1',
      label: 'No Grade 1 Awarded',
      passed: countOf1s === 0,
      current: countOf1s === 0 ? 'None' : `${countOf1s} subject(s)`,
      description: 'No grade 1 may be awarded in any subject or level.',
      severity: countOf1s > 0 ? 'crit' : 'good',
    },
    {
      id: 'max_two_grade_2s',
      label: 'Maximum Two Grade 2s',
      passed: countOf2s <= 2,
      current: `${countOf2s} / 2`,
      description: 'There can be no more than two grade 2s awarded overall.',
      severity: countOf2s > 2 ? 'crit' : countOf2s === 2 ? 'warn' : 'good',
    },
    {
      id: 'max_three_grade_3s',
      label: 'Maximum Three Grade 3s or Below',
      passed: countOf3sOrBelow <= 3,
      current: `${countOf3sOrBelow} / 3`,
      description: 'There can be no more than three grade 3s or below awarded.',
      severity: countOf3sOrBelow > 3 ? 'crit' : countOf3sOrBelow === 3 ? 'warn' : 'good',
    },
  ];

  if (hasHlGrade2AtBorderline) {
    conditions.push({
      id: 'hl_grade_2_restriction',
      label: 'HL Grade 2 Restriction (24–27 pts)',
      passed: false,
      current: `${hlGrade2Count} grade 2 at HL`,
      description: 'For candidates scoring 24–27 points, no grade 2 is permitted in Higher Level subjects (Article 13).',
      severity: 'crit',
    });
  }

  const failedConditions = conditions.filter(c => !c.passed);
  const criticalFails = failedConditions.filter(c => c.severity === 'crit');

  let status = 'good';
  let statusLabel = 'On Track';

  if (criticalFails.length > 0) {
    status = 'crit';
    statusLabel = 'Failing Condition';
  } else if (failedConditions.length > 0 || totalPoints <= 25 || hlPoints <= hlTarget) {
    status = 'warn';
    statusLabel = 'Borderline / At Risk';
  }

  // Recommendations for improvement
  const recommendations = [];
  if (hlPoints < hlTarget) {
    recommendations.push(`Higher Level score is ${hlPoints}/${hlTarget}. Gaining ${hlTarget - hlPoints} pt in an HL subject will satisfy this passing rule.`);
  }
  if (totalPoints < 24) {
    recommendations.push(`Total score is ${totalPoints}/24. ${24 - totalPoints} additional points required across subjects or core.`);
  }
  if (hasHlGrade2AtBorderline) {
    recommendations.push('A grade 2 in an HL subject bars diploma award between 24 and 27 points. Improve this HL subject to at least grade 3, or elevate total score to 28+.');
  }
  if (core.isFailingCondition) {
    recommendations.push('A grade E in TOK or EE is an automatic failing condition. Revisions or supervisor meetings are required.');
  }
  if (!casFulfilled) {
    recommendations.push('CAS portfolio is pending or lacks required strand reflections.');
  }

  return {
    totalPoints,
    subjectPoints,
    coreBonus: core.bonusPoints,
    isCorePending: core.isPending,
    hlPoints,
    slPoints,
    status,
    statusLabel,
    conditions,
    failedConditions,
    criticalCount: criticalFails.length,
    recommendations,
    isFourHl,
    isEmpty: false,
  };
}
