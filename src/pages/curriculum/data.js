/**
 * One entry per curriculum.
 *
 * These are deliberately NOT a template with the nouns swapped. Each framework
 * asks the software for something genuinely different — a 1–7 grade is not a
 * letter grade with different glyphs, and tiered entry has no analogue in the
 * DP — so each page says what its own framework demands and what Scholr does
 * about it. Anything a page cannot honestly claim is left out.
 */
export const CURRICULA = {
  ib: {
    slug: 'ib-school-management-software',
    nav: 'IB',
    seoTitle: 'IB school management software',
    seoDescription:
      'School management for IB World Schools: the 1–7 scale, HL/SL, predicted grades with history, and CAS, the Extended Essay and TOK as first-class modules. DP, MYP and PYP.',
    kicker: 'Diploma Programme · MYP · PYP',
    headline: 'Six subjects, three core components, and a number out of 45',
    lede:
      'Most school software treats that as a grading scale to configure. It is closer to a different shape of school year: every DP student has their own subject combination, the Core is assessed separately from the six groups, and predicted grades are a formal act with a deadline attached.',
    demands: [
      ['1–7, not a percentage', 'Grades are IB points. A percentage converted at report time loses the boundaries the teacher actually marked against, and nobody can reconstruct them afterwards.'],
      ['HL and SL are different subjects', 'Not a flag on one subject. They have different syllabuses, different hours and different grade boundaries, and a student takes three of each.'],
      ['The Core is not a seventh subject', 'CAS has strands and reflections but no grade. The Extended Essay runs eighteen months with a supervisor and a viva. TOK has an essay and an exhibition. Each needs its own deadlines and sign-off.'],
      ['Predicted grades are a submission', 'They go to universities with the coordinator’s name on them. A prediction that shows a single number, with no record of what it was in June, cannot be defended in October.'],
    ],
    does: [
      ['Six groups plus Core', 'Subjects carry their group and level. The Core is three modules with their own milestones, supervisors and approvals — not a folder of uploads.'],
      ['Predicted grades with history', 'Every prediction keeps its previous values and its target, so the trend is visible when a coordinator reviews the cohort.'],
      ['Criterion-level marking', 'Internal assessment is marked against the published criteria and rolls up to the subject grade, rather than being averaged out of a percentage.'],
      ['Release, per grade', 'A mark is private to the teacher until published — to students and to families separately.'],
    ],
    hidden: 'A school running only the DP never sees a GPA field, a tier selector or a UCAS reference.',
  },

  igcse: {
    slug: 'igcse-school-management-software',
    nav: 'IGCSE',
    seoTitle: 'IGCSE & GCSE school management software',
    seoDescription:
      'School management for IGCSE and GCSE: 9–1 and A*–G side by side, foundation and higher tier entry, coursework tracked against the syllabus, and predicted grades for sixth-form applications.',
    kicker: 'Cambridge · Edexcel · GCSE',
    headline: 'Two grading scales, two tiers, and a coursework deadline every fortnight',
    lede:
      'An international school often runs 9–1 and A*–G in the same building, because different boards moved at different times. Tiered entry then caps what a student can be awarded before they sit anything — a decision the software has to hold, not a note in a spreadsheet.',
    demands: [
      ['9–1 and A*–G, at once', 'Not a migration from one to the other. Both scales have to be live in the same school, in the same report, without a conversion table in the middle.'],
      ['Tiered entry caps the grade', 'A foundation-tier candidate cannot be awarded above a 5. If the gradebook accepts a 7, the report is wrong and nobody finds out until results day.'],
      ['Coursework is not homework', 'Non-examined assessment has board deadlines, authentication requirements and a word count. It belongs against the syllabus component, not a generic assignment.'],
      ['Mocks drive predictions', 'Sixth-form and college applications need predicted grades that come from the mock series, with the mock’s own boundaries applied.'],
    ],
    does: [
      ['Both scales, per subject', 'The scale is set on the subject, so a school can run 9–1 maths and A*–G Latin without either being converted.'],
      ['Tier held on the entry', 'Foundation and higher are recorded against the student’s entry, and the gradebook refuses a grade outside that tier’s range.'],
      ['Coursework against components', 'A piece of NEA attaches to its syllabus component, with its own deadline and submission state.'],
      ['Mock series as their own thing', 'A mock is recorded as a mock, so it can feed a prediction without contaminating the term’s attainment record.'],
    ],
    hidden: 'A GCSE-only school never sees CAS, the Extended Essay, TOK or an IB points total.',
  },

  alevel: {
    slug: 'a-level-school-management-software',
    nav: 'A-Level',
    seoTitle: 'A-Level school management software',
    seoDescription:
      'School management for A-Level: AS and A2 units, linear and modular routes, predicted grades in the shape UCAS wants them, EPQ tracking and block-aware enrolment.',
    kicker: 'AS · A2 · EPQ · UCAS',
    headline: 'Everything here eventually becomes one line on a UCAS form',
    lede:
      'A-Level is a small number of subjects taken very seriously, and the year is organised around a single external deadline. The software’s job is to make the prediction on that form defensible: where it came from, who agreed it, and what the student was doing when it was made.',
    demands: [
      ['AS and A2 are not two years of one thing', 'Depending on the board and the route, AS may or may not count. A system that assumes it does will misreport a linear cohort.'],
      ['Predictions carry a reference', 'The predicted grade and the tutor’s reference are written by different people and reviewed together. Split across two systems, they end up disagreeing.'],
      ['Option blocks decide enrolment', 'Three or four subjects drawn from mutually exclusive blocks. A combination is only valid if the blocks allow it.'],
      ['EPQ runs alongside', 'An independent project with a supervisor, a production log and its own grade, on a different timetable from the subjects.'],
    ],
    does: [
      ['Units and routes', 'AS and A2 units are recorded separately and aggregate according to the route the school actually runs.'],
      ['Predictions with their trail', 'Each prediction keeps its history and its author, so a head of sixth form can see how it moved and who moved it.'],
      ['Block-aware enrolment', 'Subject blocks are modelled, so an impossible combination is refused at enrolment rather than discovered in September.'],
      ['EPQ as a module', 'Supervisor, milestones and log — tracked like the IB Core, not as a spare assignment.'],
    ],
    hidden: 'An A-Level school never sees a GPA, a credit total or an MYP criterion.',
    note: 'Option blocks are also what our sister product Schedual solves for the timetable itself.',
  },

  us: {
    slug: 'us-school-management-software',
    nav: 'US / AP',
    seoTitle: 'US curriculum & AP school management software',
    seoDescription:
      'School management for US-curriculum and AP international schools: weighted and unweighted GPA, credits, semester grading, honors weighting and transcript-shaped reporting.',
    kicker: 'GPA · credits · AP · transcripts',
    headline: 'The transcript is the product, and it has to be right for four years',
    lede:
      'A US-curriculum school is not marking towards one exam series; it is accumulating a record. Credits, GPA and course level compound over four years, and a mistake in ninth grade is still on the document a university reads.',
    demands: [
      ['GPA is two numbers', 'Weighted and unweighted, both reported, both derived from the same grades under different rules about honors and AP.'],
      ['Credits are earned, not implied', 'A course carries a credit value and a student either earns it or does not. Attendance and grade thresholds can each gate it.'],
      ['Semesters, not terms', 'Grades close twice a year and the semester grade is the record. Quarters and progress reports sit underneath it.'],
      ['Course level changes the maths', 'Regular, honors and AP: the same letter grade is worth different GPA points, and the weighting has to live on the course.'],
    ],
    does: [
      ['Weighted and unweighted together', 'Both computed from the same grade record, with weighting held on the course rather than typed in per student.'],
      ['Credits on the course', 'Credit value and the conditions for earning it are course properties, and the total follows the student.'],
      ['Semester close', 'A semester grade is a first-class record, not an average of whatever happened to be entered that half-year.'],
      ['Transcript-shaped reporting', 'Reports come out in the arrangement a receiving school expects, rather than a term report relabelled.'],
    ],
    hidden: 'A US-curriculum school never sees an IB points total, a tier selector or an AS unit.',
  },
};

export const CURRICULUM_LIST = Object.values(CURRICULA);
