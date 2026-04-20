// Shared mock data for the Scholr demo sandbox.
// Fully interconnected IB DP school — every student, class, teacher, parent,
// assignment, feedback entry and grade references the same canonical IDs.
// All derived views (student / teacher / parent / leader) read from here.

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCHOOL
// ─────────────────────────────────────────────────────────────────────────────
export const SCHOOL = {
  id: 'sch_meridian',
  name: 'Meridian International Academy',
  city: 'Geneva',
  country: 'Switzerland',
  curriculum: 'IB Diploma Programme',
  academicYear: '2025–2026',
  termName: 'Term 2',
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUBJECTS (IB HL / SL)
// ─────────────────────────────────────────────────────────────────────────────
export const SUBJECTS = [
  { id: 'math_aa_hl', name: 'Mathematics AA HL', group: 'Group 5', level: 'HL', color: 'bg-sky-500' },
  { id: 'eng_lit_hl', name: 'English Literature HL', group: 'Group 1', level: 'HL', color: 'bg-rose-500' },
  { id: 'bio_hl',     name: 'Biology HL',            group: 'Group 4', level: 'HL', color: 'bg-emerald-500' },
  { id: 'hist_sl',    name: 'History SL',            group: 'Group 3', level: 'SL', color: 'bg-amber-500' },
  { id: 'econ_sl',    name: 'Economics SL',          group: 'Group 3', level: 'SL', color: 'bg-violet-500' },
  { id: 'fre_b_sl',   name: 'French B SL',           group: 'Group 2', level: 'SL', color: 'bg-cyan-500' },
  { id: 'tok',        name: 'Theory of Knowledge',   group: 'Core',    level: 'Core', color: 'bg-slate-500' },
];

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id);

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEACHERS
// ─────────────────────────────────────────────────────────────────────────────
export const TEACHERS = [
  { id: 'tch_chen',    name: 'Dr. Sarah Chen',      initials: 'SC', department: 'Sciences',     email: 'sarah.chen@meridian.edu' },
  { id: 'tch_patel',   name: 'Ms. Priya Patel',     initials: 'PP', department: 'Mathematics',  email: 'priya.patel@meridian.edu' },
  { id: 'tch_harrow',  name: 'Mr. Daniel Harrow',   initials: 'DH', department: 'English',      email: 'daniel.harrow@meridian.edu' },
  { id: 'tch_novak',   name: 'Ms. Lena Novak',      initials: 'LN', department: 'Humanities',   email: 'lena.novak@meridian.edu' },
  { id: 'tch_ruiz',    name: 'Mr. Carlos Ruiz',     initials: 'CR', department: 'Social Sci.',  email: 'carlos.ruiz@meridian.edu' },
  { id: 'tch_dubois',  name: 'Mme. Claire Dubois',  initials: 'CD', department: 'Languages',    email: 'claire.dubois@meridian.edu' },
];

export const getTeacher = (id) => TEACHERS.find((t) => t.id === id);

// ─────────────────────────────────────────────────────────────────────────────
// 4. STUDENTS (DP1 & DP2)
// ─────────────────────────────────────────────────────────────────────────────
export const STUDENTS = [
  { id: 'stu_amelie',  name: 'Amélie Laurent',    initials: 'AL', grade: 'DP2', advisorId: 'tch_harrow' },
  { id: 'stu_thomas',  name: 'Thomas Laurent',    initials: 'TL', grade: 'MYP4', advisorId: 'tch_novak' },
  { id: 'stu_noah',    name: 'Noah Weiss',        initials: 'NW', grade: 'DP2', advisorId: 'tch_harrow' },
  { id: 'stu_priya',   name: 'Priya Shah',        initials: 'PS', grade: 'DP2', advisorId: 'tch_chen' },
  { id: 'stu_kenji',   name: 'Kenji Ito',         initials: 'KI', grade: 'DP2', advisorId: 'tch_ruiz' },
  { id: 'stu_sofia',   name: 'Sofia Oliveira',    initials: 'SO', grade: 'DP2', advisorId: 'tch_dubois' },
  { id: 'stu_lukas',   name: 'Lukas Becker',      initials: 'LB', grade: 'DP1', advisorId: 'tch_patel' },
  { id: 'stu_zara',    name: 'Zara Okafor',       initials: 'ZO', grade: 'DP1', advisorId: 'tch_chen' },
];

export const getStudent = (id) => STUDENTS.find((s) => s.id === id);

// ─────────────────────────────────────────────────────────────────────────────
// 5. PARENTS (linked to students)
// ─────────────────────────────────────────────────────────────────────────────
export const PARENTS = [
  { id: 'par_elena',   name: 'Elena Laurent',     initials: 'EL', email: 'elena.laurent@example.com',   childIds: ['stu_amelie', 'stu_thomas'] },
  { id: 'par_david',   name: 'David Weiss',       initials: 'DW', email: 'david.weiss@example.com',     childIds: ['stu_noah'] },
  { id: 'par_anjali',  name: 'Anjali Shah',       initials: 'AS', email: 'anjali.shah@example.com',     childIds: ['stu_priya'] },
];

export const getParent = (id) => PARENTS.find((p) => p.id === id);
export const getChildrenOf = (parentId) =>
  (getParent(parentId)?.childIds || []).map(getStudent).filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// 6. CLASSES (subject + teacher + enrolled students)
// ─────────────────────────────────────────────────────────────────────────────
export const CLASSES = [
  {
    id: 'cls_bio_dp2',
    name: 'Biology HL — DP2',
    subjectId: 'bio_hl',
    teacherId: 'tch_chen',
    room: 'Lab 3',
    studentIds: ['stu_amelie', 'stu_noah', 'stu_priya', 'stu_kenji', 'stu_sofia'],
  },
  {
    id: 'cls_bio_dp1',
    name: 'Biology HL — DP1',
    subjectId: 'bio_hl',
    teacherId: 'tch_chen',
    room: 'Lab 3',
    studentIds: ['stu_lukas', 'stu_zara'],
  },
  {
    id: 'cls_math_dp2',
    name: 'Mathematics AA HL — DP2',
    subjectId: 'math_aa_hl',
    teacherId: 'tch_patel',
    room: 'B-204',
    studentIds: ['stu_amelie', 'stu_noah', 'stu_kenji', 'stu_sofia'],
  },
  {
    id: 'cls_eng_dp2',
    name: 'English Literature HL — DP2',
    subjectId: 'eng_lit_hl',
    teacherId: 'tch_harrow',
    room: 'A-108',
    studentIds: ['stu_amelie', 'stu_priya', 'stu_sofia'],
  },
  {
    id: 'cls_hist_dp2',
    name: 'History SL — DP2',
    subjectId: 'hist_sl',
    teacherId: 'tch_novak',
    room: 'C-301',
    studentIds: ['stu_amelie', 'stu_noah', 'stu_kenji'],
  },
  {
    id: 'cls_econ_dp2',
    name: 'Economics SL — DP2',
    subjectId: 'econ_sl',
    teacherId: 'tch_ruiz',
    room: 'C-204',
    studentIds: ['stu_amelie', 'stu_priya'],
  },
  {
    id: 'cls_fre_dp2',
    name: 'French B SL — DP2',
    subjectId: 'fre_b_sl',
    teacherId: 'tch_dubois',
    room: 'A-210',
    studentIds: ['stu_amelie', 'stu_sofia'],
  },
  {
    id: 'cls_tok_dp2',
    name: 'Theory of Knowledge — DP2',
    subjectId: 'tok',
    teacherId: 'tch_chen',
    room: 'A-201',
    studentIds: ['stu_amelie', 'stu_noah', 'stu_priya', 'stu_kenji', 'stu_sofia'],
  },
];

export const getClass = (id) => CLASSES.find((c) => c.id === id);
export const getClassesForStudent = (studentId) =>
  CLASSES.filter((c) => c.studentIds.includes(studentId));
export const getClassesForTeacher = (teacherId) =>
  CLASSES.filter((c) => c.teacherId === teacherId);

// ─────────────────────────────────────────────────────────────────────────────
// 7. ASSIGNMENTS
//    type: 'internal_assessment' | 'extended_essay' | 'homework' | 'essay' | 'lab_report'
//    status per student tracked separately in SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
export const ASSIGNMENTS = [
  // Internal Assessments
  {
    id: 'asg_bio_ia',
    classId: 'cls_bio_dp2',
    title: 'Biology IA: Enzyme Kinetics Investigation',
    type: 'internal_assessment',
    description: 'Individual scientific investigation (≈10 pages). Assessed against IB Biology IA criteria A–E.',
    dueIn: 'In 3 days',
    dueLabel: '23 April 2026',
    maxScore: 24,
    ibCriteria: ['Personal engagement', 'Exploration', 'Analysis', 'Evaluation', 'Communication'],
  },
  {
    id: 'asg_hist_ia',
    classId: 'cls_hist_dp2',
    title: 'History IA: Cold War Source Analysis',
    type: 'internal_assessment',
    description: '2,200-word historical investigation — student-selected research question.',
    dueIn: 'Next week',
    dueLabel: '30 April 2026',
    maxScore: 25,
    ibCriteria: ['Identification & evaluation of sources', 'Investigation', 'Reflection'],
  },
  {
    id: 'asg_math_ia',
    classId: 'cls_math_dp2',
    title: 'Mathematics AA IA: Exploration',
    type: 'internal_assessment',
    description: '12–20 page mathematical exploration on a topic of personal interest.',
    dueIn: 'In 2 weeks',
    dueLabel: '5 May 2026',
    maxScore: 20,
    ibCriteria: ['Presentation', 'Mathematical communication', 'Personal engagement', 'Reflection', 'Use of mathematics'],
  },
  // Extended Essay
  {
    id: 'asg_ee_first_draft',
    classId: null, // EE sits outside class — core
    title: 'Extended Essay — First Full Draft',
    type: 'extended_essay',
    description: '4,000-word EE in chosen subject. First complete draft due to supervisor.',
    dueIn: 'In 10 days',
    dueLabel: '30 April 2026',
    maxScore: 34,
    ibCriteria: ['Focus & method', 'Knowledge & understanding', 'Critical thinking', 'Presentation', 'Engagement'],
  },
  // Homework & tasks
  {
    id: 'asg_math_ps7',
    classId: 'cls_math_dp2',
    title: 'Calculus Problem Set 7',
    type: 'homework',
    description: 'Problems 1–14 from Chapter 9 (integration by parts & partial fractions).',
    dueIn: 'Tomorrow',
    dueLabel: '21 April 2026',
    maxScore: 20,
    ibCriteria: [],
  },
  {
    id: 'asg_eng_beloved',
    classId: 'cls_eng_dp2',
    title: 'Literary Analysis — Beloved by Toni Morrison',
    type: 'essay',
    description: '1,200-word critical essay. Focus on memory, trauma and narrative voice.',
    dueIn: 'In 5 days',
    dueLabel: '25 April 2026',
    maxScore: 30,
    ibCriteria: ['Knowledge & understanding', 'Analysis & evaluation', 'Focus & organisation', 'Language'],
  },
  {
    id: 'asg_fre_oral',
    classId: 'cls_fre_dp2',
    title: 'Individual Oral — Preparation Notes',
    type: 'homework',
    description: 'Prepare 10 bullet points on chosen stimulus for mock individual oral.',
    dueIn: 'In 4 days',
    dueLabel: '24 April 2026',
    maxScore: 10,
    ibCriteria: [],
  },
  {
    id: 'asg_econ_mcq',
    classId: 'cls_econ_dp2',
    title: 'Macroeconomics — MCQ Revision Set',
    type: 'homework',
    description: '40 multiple-choice questions covering aggregate demand & supply.',
    dueIn: 'In 6 days',
    dueLabel: '26 April 2026',
    maxScore: 40,
    ibCriteria: [],
  },
];

export const getAssignment = (id) => ASSIGNMENTS.find((a) => a.id === id);
export const getAssignmentsForClass = (classId) => ASSIGNMENTS.filter((a) => a.classId === classId);

// Assignments visible to a student = from enrolled classes + core (EE/TOK)
export const getAssignmentsForStudent = (studentId) => {
  const classIds = getClassesForStudent(studentId).map((c) => c.id);
  return ASSIGNMENTS.filter((a) => classIds.includes(a.classId) || a.classId === null);
};

// Assignments for a teacher = assignments in classes they teach
export const getAssignmentsForTeacher = (teacherId) => {
  const classIds = getClassesForTeacher(teacherId).map((c) => c.id);
  return ASSIGNMENTS.filter((a) => classIds.includes(a.classId));
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. SUBMISSIONS (student × assignment)
//    status: 'not_started' | 'in_progress' | 'submitted' | 'late' | 'graded'
// ─────────────────────────────────────────────────────────────────────────────
export const SUBMISSIONS = [
  // Amélie — DP2 focus student
  { id: 'sub_1', assignmentId: 'asg_bio_ia',          studentId: 'stu_amelie', status: 'submitted',  submittedAt: '3h ago',   late: false },
  { id: 'sub_2', assignmentId: 'asg_hist_ia',         studentId: 'stu_amelie', status: 'in_progress', submittedAt: null,      late: false },
  { id: 'sub_3', assignmentId: 'asg_math_ia',         studentId: 'stu_amelie', status: 'in_progress', submittedAt: null,      late: false },
  { id: 'sub_4', assignmentId: 'asg_ee_first_draft',  studentId: 'stu_amelie', status: 'in_progress', submittedAt: null,      late: false },
  { id: 'sub_5', assignmentId: 'asg_math_ps7',        studentId: 'stu_amelie', status: 'not_started', submittedAt: null,      late: false },
  { id: 'sub_6', assignmentId: 'asg_eng_beloved',     studentId: 'stu_amelie', status: 'not_started', submittedAt: null,      late: false },
  { id: 'sub_7', assignmentId: 'asg_fre_oral',        studentId: 'stu_amelie', status: 'in_progress', submittedAt: null,      late: false },
  { id: 'sub_8', assignmentId: 'asg_econ_mcq',        studentId: 'stu_amelie', status: 'not_started', submittedAt: null,      late: false },

  // Other DP2 students — Biology IA submissions (drives Dr. Chen's queue)
  { id: 'sub_10', assignmentId: 'asg_bio_ia', studentId: 'stu_noah',  status: 'submitted', submittedAt: '5h ago',     late: false },
  { id: 'sub_11', assignmentId: 'asg_bio_ia', studentId: 'stu_priya', status: 'submitted', submittedAt: 'Yesterday',  late: false },
  { id: 'sub_12', assignmentId: 'asg_bio_ia', studentId: 'stu_kenji', status: 'late',      submittedAt: '2 days ago', late: true },
  { id: 'sub_13', assignmentId: 'asg_bio_ia', studentId: 'stu_sofia', status: 'submitted', submittedAt: '6h ago',     late: false },
  // A couple of TOK essays also pending grading
  { id: 'sub_14', assignmentId: 'asg_eng_beloved', studentId: 'stu_priya', status: 'submitted', submittedAt: 'Yesterday', late: false },
  { id: 'sub_15', assignmentId: 'asg_eng_beloved', studentId: 'stu_sofia', status: 'in_progress', submittedAt: null, late: false },
];

export const getSubmission = (studentId, assignmentId) =>
  SUBMISSIONS.find((s) => s.studentId === studentId && s.assignmentId === assignmentId);
export const getSubmissionsForTeacher = (teacherId) => {
  const classIds = getClassesForTeacher(teacherId).map((c) => c.id);
  const assignmentIds = ASSIGNMENTS.filter((a) => classIds.includes(a.classId)).map((a) => a.id);
  return SUBMISSIONS.filter((s) => assignmentIds.includes(s.assignmentId));
};
export const getPendingGradingForTeacher = (teacherId) =>
  getSubmissionsForTeacher(teacherId).filter((s) => s.status === 'submitted' || s.status === 'late');

// ─────────────────────────────────────────────────────────────────────────────
// 9. TEACHER FEEDBACK (attached to submissions)
// ─────────────────────────────────────────────────────────────────────────────
export const FEEDBACK = [
  {
    id: 'fb_1',
    submissionId: 'sub_1', // Amélie — Biology IA (already submitted, not yet graded)
    teacherId: 'tch_chen',
    createdAt: '2h ago',
    body: "Excellent experimental design, Amélie. Your control of variables is very strong. For Analysis, push the uncertainty propagation a bit further and quantify how R² changes under different temperature ranges.",
  },
  {
    id: 'fb_2',
    submissionId: 'sub_4', // Amélie — EE first draft
    teacherId: 'tch_harrow',
    createdAt: 'Yesterday',
    body: 'Your research question has narrowed nicely. Section 2 needs tighter engagement with secondary criticism — bring in at least two counter-readings before the next meeting.',
  },
  {
    id: 'fb_3',
    submissionId: 'sub_10', // Noah — Biology IA
    teacherId: 'tch_chen',
    createdAt: '4h ago',
    body: 'Solid engagement. Evaluation needs more depth — explicitly link each limitation to a concrete improvement.',
  },
];

export const getFeedbackForSubmission = (submissionId) =>
  FEEDBACK.filter((f) => f.submissionId === submissionId);
export const getFeedbackForStudent = (studentId) => {
  const subIds = SUBMISSIONS.filter((s) => s.studentId === studentId).map((s) => s.id);
  return FEEDBACK.filter((f) => subIds.includes(f.submissionId));
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. GRADES (per student × subject, term snapshot)
// ─────────────────────────────────────────────────────────────────────────────
export const STUDENT_GRADES = [
  // Amélie — DP2
  { studentId: 'stu_amelie', subjectId: 'math_aa_hl', current: 6, predicted: 7, trend: 'up' },
  { studentId: 'stu_amelie', subjectId: 'eng_lit_hl', current: 6, predicted: 6, trend: 'flat' },
  { studentId: 'stu_amelie', subjectId: 'bio_hl',     current: 7, predicted: 7, trend: 'up' },
  { studentId: 'stu_amelie', subjectId: 'hist_sl',    current: 5, predicted: 6, trend: 'up' },
  { studentId: 'stu_amelie', subjectId: 'econ_sl',    current: 6, predicted: 6, trend: 'flat' },
  { studentId: 'stu_amelie', subjectId: 'fre_b_sl',   current: 5, predicted: 5, trend: 'down' },

  // Thomas — MYP4 (simplified — shares grading scale for demo)
  { studentId: 'stu_thomas', subjectId: 'math_aa_hl', current: 5, predicted: 6, trend: 'up' },
  { studentId: 'stu_thomas', subjectId: 'eng_lit_hl', current: 6, predicted: 6, trend: 'flat' },
  { studentId: 'stu_thomas', subjectId: 'bio_hl',     current: 5, predicted: 5, trend: 'flat' },
  { studentId: 'stu_thomas', subjectId: 'hist_sl',    current: 6, predicted: 6, trend: 'up' },

  // Noah
  { studentId: 'stu_noah',   subjectId: 'bio_hl',     current: 5, predicted: 6, trend: 'up' },
  { studentId: 'stu_noah',   subjectId: 'math_aa_hl', current: 5, predicted: 5, trend: 'flat' },
  // Priya
  { studentId: 'stu_priya',  subjectId: 'bio_hl',     current: 6, predicted: 6, trend: 'flat' },
  { studentId: 'stu_priya',  subjectId: 'eng_lit_hl', current: 7, predicted: 7, trend: 'up' },
];

export const getGradesForStudent = (studentId) =>
  STUDENT_GRADES
    .filter((g) => g.studentId === studentId)
    .map((g) => ({ ...g, subject: getSubject(g.subjectId)?.name || g.subjectId }));

// ─────────────────────────────────────────────────────────────────────────────
// 11. TIMETABLE (for Amélie's DP2 day — drives student & teacher "today")
// ─────────────────────────────────────────────────────────────────────────────
export const TIMETABLE_TODAY = [
  { time: '08:30 – 09:45', classId: 'cls_math_dp2' },
  { time: '10:00 – 11:15', classId: 'cls_bio_dp2' },
  { time: '11:30 – 12:45', classId: 'cls_eng_dp2' },
  { time: '13:45 – 15:00', classId: 'cls_hist_dp2' },
  { time: '15:15 – 16:30', classId: 'cls_tok_dp2' },
].map((slot) => {
  const c = getClass(slot.classId);
  const t = c ? getTeacher(c.teacherId) : null;
  const subj = c ? getSubject(c.subjectId) : null;
  return {
    time: slot.time,
    classId: slot.classId,
    subject: subj?.name || 'Class',
    room: c?.room || '',
    teacher: t?.name || '',
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. ATTENDANCE (Amélie's term snapshot)
// ─────────────────────────────────────────────────────────────────────────────
export const ATTENDANCE = {
  present: 94,
  absent: 3,
  late: 3,
  last30Days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i === 6 || i === 19 ? 'late' : i === 13 ? 'absent' : 'present',
  })),
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  { id: 'n1', title: 'Mock exam schedule published',            from: 'DP Coordinator',  when: '2h ago' },
  { id: 'n2', title: 'CAS reflection due Friday',                from: 'Ms. Novak',       when: 'Yesterday' },
  { id: 'n3', title: 'Parent–teacher conferences open for booking', from: 'Head of School', when: '2 days ago' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 14. DERIVED / UI-FACING VIEWS
//    (Kept as named exports so existing demo pages continue to work unchanged
//     where they imported STUDENT / TEACHER / PARENT / LEADER etc.)
// ─────────────────────────────────────────────────────────────────────────────
const amelie = getStudent('stu_amelie');
const sarah  = getTeacher('tch_chen');
const elena  = getParent('par_elena');

export const STUDENT = {
  id: amelie.id,
  name: amelie.name,
  grade: amelie.grade,
  avatarInitials: amelie.initials,
  advisor: getTeacher(amelie.advisorId)?.name || '—',
};

export const TEACHER = {
  id: sarah.id,
  name: sarah.name,
  department: sarah.department,
  avatarInitials: sarah.initials,
  classes: getClassesForTeacher(sarah.id).map((c) => c.name),
};

export const PARENT = {
  id: elena.id,
  name: elena.name,
  avatarInitials: elena.initials,
  children: getChildrenOf(elena.id).map((c) => ({ id: c.id, name: c.name, grade: c.grade })),
};

export const LEADER = {
  id: 'adm_okonkwo',
  name: 'Dr. James Okonkwo',
  title: 'Head of School',
  avatarInitials: 'JO',
};

// Legacy flat arrays derived from the normalized data ────────────────────────

// Student grades view for Amélie (what the old GRADES export gave)
export const GRADES = getGradesForStudent(amelie.id);

// Upcoming assignments from Amélie's perspective (not yet submitted)
export const UPCOMING_ASSIGNMENTS = getAssignmentsForStudent(amelie.id)
  .map((a) => {
    const sub = getSubmission(amelie.id, a.id);
    const cls = a.classId ? getClass(a.classId) : null;
    const subj = cls ? getSubject(cls.subjectId)?.name : 'Core';
    return {
      id: a.id,
      title: a.title,
      subject: subj,
      dueIn: a.dueIn,
      status: sub?.status || 'not_started',
      type: a.type,
    };
  })
  .filter((a) => a.status !== 'submitted' && a.status !== 'graded');

// Teacher class cards for Dr. Chen
export const TEACHER_CLASSES = getClassesForTeacher(sarah.id).map((c) => {
  const classAssignments = getAssignmentsForClass(c.id);
  const classAssignmentIds = classAssignments.map((a) => a.id);
  const pending = SUBMISSIONS.filter(
    (s) => classAssignmentIds.includes(s.assignmentId) && (s.status === 'submitted' || s.status === 'late')
  ).length;
  const grades = STUDENT_GRADES.filter(
    (g) => g.subjectId === c.subjectId && c.studentIds.includes(g.studentId)
  );
  const avg = grades.length
    ? Math.round((grades.reduce((sum, g) => sum + g.current, 0) / grades.length) * 10) / 10
    : null;
  return {
    id: c.id,
    name: c.name,
    students: c.studentIds.length,
    pendingGrading: pending,
    avgGrade: avg ?? '—',
  };
});

// Submissions queue for Dr. Chen (what she needs to grade next)
export const SUBMISSIONS_TO_REVIEW = getPendingGradingForTeacher(sarah.id).map((s) => {
  const a = getAssignment(s.assignmentId);
  const stu = getStudent(s.studentId);
  return {
    id: s.id,
    student: stu?.name || '—',
    assignment: a?.title || '—',
    submittedAt: s.submittedAt || '—',
    late: !!s.late,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. SCHOOL-WIDE METRICS (Leader dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const SCHOOL_METRICS = {
  totalStudents: 642,
  totalTeachers: 58,
  activeClasses: 94,
  attendanceRate: 96.4,
  avgPredictedGrade: 5.8,
  openSupportTickets: 3,
};

export const ENROLLMENT_TREND = [
  { year: '2021', students: 482 },
  { year: '2022', students: 521 },
  { year: '2023', students: 569 },
  { year: '2024', students: 604 },
  { year: '2025', students: 642 },
];

export const GRADE_DISTRIBUTION = [
  { grade: '7', count: 58 },
  { grade: '6', count: 142 },
  { grade: '5', count: 198 },
  { grade: '4', count: 144 },
  { grade: '3', count: 72 },
  { grade: '2', count: 22 },
  { grade: '1', count: 6 },
];