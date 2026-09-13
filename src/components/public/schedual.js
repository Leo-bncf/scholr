/**
 * The links across to our other product.
 *
 * Kept in one file because they are external URLs: if Schedual reorganises its
 * routes, this is the single place a dead link can be fixed, rather than six
 * pages each holding their own copy. Every URL here was checked to return 200.
 */
export const SCHEDUAL_HOME = 'https://schedual-pro.com';

/** Schedual's own page for each curriculum, matched to ours. */
export const SCHEDUAL_BY_CURRICULUM = {
  'ib-school-management-software': {
    href: `${SCHEDUAL_HOME}/ib-dp-timetable-software/`,
    label: 'IB DP timetable software',
    line: 'The DP has no class of thirty — every student is their own schedule, and the solver builds around option blocks and HL/SL pairings.',
  },
  'igcse-school-management-software': {
    href: `${SCHEDUAL_HOME}/gcse-timetable-software/`,
    label: 'GCSE & IGCSE timetable software',
    line: 'Option blocks, setted groups and tiered classes, resolved against teacher loads and room capacity.',
  },
  'a-level-school-management-software': {
    href: `${SCHEDUAL_HOME}/a-level-timetable-software/`,
    label: 'A-Level timetable software',
    line: 'The same option blocks that decide whether a subject combination is legal also decide whether it can be timetabled.',
  },
  'us-school-management-software': {
    href: `${SCHEDUAL_HOME}/us-high-school-scheduling-software/`,
    label: 'US high-school scheduling software',
    line: 'Semester scheduling, course requests and section balancing across a four-year graduation plan.',
  },
};

/** The rest of Schedual's public site, for the /Schedual page. */
export const SCHEDUAL_PAGES = [
  ['Timetabling for the IB', `${SCHEDUAL_HOME}/ib-timetable-software/`],
  ['MYP', `${SCHEDUAL_HOME}/myp-scheduling-software/`],
  ['PYP', `${SCHEDUAL_HOME}/pyp-scheduling-software/`],
  ['GCSE & IGCSE', `${SCHEDUAL_HOME}/gcse-timetable-software/`],
  ['A-Level', `${SCHEDUAL_HOME}/a-level-timetable-software/`],
  ['French Bac', `${SCHEDUAL_HOME}/french-bac-timetable-software/`],
  ['US high school', `${SCHEDUAL_HOME}/us-high-school-scheduling-software/`],
  ['Their pricing', `${SCHEDUAL_HOME}/Pricing`],
  ['Their view of this integration', `${SCHEDUAL_HOME}/ScholrIntegration`],
];
