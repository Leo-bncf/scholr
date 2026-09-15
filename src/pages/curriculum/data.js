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
    detail: [
      'A Diploma cohort is not a year group with a shared timetable. Every student takes six subjects across the groups at their own mix of Higher and Standard, so a class list is an intersection rather than a form. Scholr enrols students into classes individually and derives the cohort from that, which is why a coordinator can ask \u201cwho is taking Physics HL and History HL\u201d and get an answer without a spreadsheet.',
      'Internal assessment is where the year is actually won or lost. Each subject has its own IA with its own deadline and its own criteria, and they cluster in the same term. Scholr holds the deadline against the assignment, keeps every draft rather than overwriting, and shows a supervisor what changed between a first draft and a final. The same versioning is what lets an EE supervisor evidence progress across eighteen months.',
      'Predicted grades are a formal submission with the coordinator\u2019s name on them. Each prediction keeps its history and its target, so a number that moved from a 5 in June to a 6 in October carries the reason with it. A coordinator reviewing the cohort sees the trend rather than a snapshot, and can question a prediction instead of simply overwriting a teacher\u2019s judgement.',
      'A school running MYP into DP keeps one record per student across both. MYP marks on four criteria A\u2013D, DP on levels 1\u20137; the scales do not have to be reconciled because each class is marked in its own programme\u2019s shape. Nothing converts, and nothing is lost at the transition year.',
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
    detail: [
      'Two boards in one building is the ordinary case, not the exception. Cambridge and Edexcel moved to numeric grading at different times, so a school can be running 9\u20131 in Mathematics and A*\u2013G in a language in the same year group. Scholr holds the scale on the subject rather than on the school, so a report prints what each subject was actually marked on.',
      'Tiered entry is a decision with consequences, and it belongs in the record rather than in someone\u2019s memory. A foundation-tier entry caps the grade a student can be awarded before they sit the paper. Holding that against the student\u2019s subject means a predicted grade above the cap is visible as a contradiction rather than being discovered at results.',
      'Coursework is a calendar problem more than a marking one. Deadlines arrive every fortnight across several subjects, and the students who slip do so quietly. The assignment list shows what is outstanding per class and per student, with late work flagged against the deadline the assignment carried \u2014 not against when a teacher got round to marking it.',
      'Most IGCSE schools are feeding a sixth form, their own or somebody else\u2019s. Predicted grades for those applications come from the same gradebook the teaching happened in, so a reference is built on the marks rather than on a separately maintained list.',
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
    detail: [
      'A-Level cohorts are small and the stakes per student are high. A subject might have nine candidates, which means an average tells you almost nothing and the individual trend tells you everything. Scholr shows the per-student history against target rather than leading with a cohort mean.',
      'UCAS predictions are the pressure point of the autumn term. They are a formal statement, made early, on incomplete evidence, and they follow the student. Predictions here keep their previous values and the marks behind them, so a head of sixth form reviewing forty references can see which numbers moved and why.',
      'Schools still differ on AS. Some enter students for AS as a qualification, some teach it as an internal checkpoint, some skip it. Scholr does not assume: AS sits as its own set of classes and marks if a school uses it, and simply does not appear if it does not.',
      'Where A-Level runs alongside IB Diploma \u2014 common in international schools offering both routes at sixteen \u2014 the two live in the same timetable and the same records. A student\u2019s attendance, behaviour and pastoral notes do not fork because of which programme they chose.',
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
    detail: [
      'The unit of account is the credit, not the year. A US high-school student accumulates credits toward a diploma, and a transcript is the running total rather than a snapshot of the current grade. Scholr records credit against the course, so what a school hands a university is assembled from the record rather than typed up at the end.',
      'GPA is arithmetic on top of that, and the arithmetic is a policy decision. Weighted or unweighted, whether Honors and AP carry extra points, how a repeated course is treated \u2014 schools differ, and a system that hard-codes one answer forces a school to keep the real numbers somewhere else. The weighting is a school-level setting here.',
      'Semesters cut across the year differently from terms, and reporting follows the semester. A grade is final at semester close and goes onto the transcript at that point, which is a different rhythm from a school reporting three times a year against continuing courses.',
      'An international school running a US diploma alongside IB or A-Level usually does so for a specific student population. Both live in the same building and the same database; the GPA machinery simply does not appear on a class that is not on the US programme.',
    ],
    hidden: 'A US-curriculum school never sees an IB points total, a tier selector or an AS unit.',
  },
};

export const CURRICULUM_LIST = Object.values(CURRICULA);
