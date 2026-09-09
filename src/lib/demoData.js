/**
 * Demo data for super-admin impersonation mode.
 * Seeds the React Query cache so all pages render fully populated.
 */

const NOW = new Date('2026-03-23T10:00:00Z');

// ─── IDs ──────────────────────────────────────────────────────────────────────
const D = {
  ay: 'demo-ay-1',
  t1: 'demo-term-1',
  t2: 'demo-term-2',
  t3: 'demo-term-3',
  subMath: 'demo-sub-math',
  subPhysics: 'demo-sub-physics',
  subHistory: 'demo-sub-history',
  subEnglish: 'demo-sub-english',
  subBiology: 'demo-sub-bio',
  subEcon: 'demo-sub-econ',
  subTOK: 'demo-sub-tok',
  cls1: 'demo-cls-1',
  cls2: 'demo-cls-2',
  cls3: 'demo-cls-3',
  cls4: 'demo-cls-4',
  cls5: 'demo-cls-5',
  cls6: 'demo-cls-6',
  cohortDP1: 'demo-cohort-dp1',
  cohortDP2: 'demo-cohort-dp2',
  admin: 'demo-user-admin',
  coord: 'demo-user-coord',
  t1id: 'demo-user-t1',
  t2id: 'demo-user-t2',
  t3id: 'demo-user-t3',
  t4id: 'demo-user-t4',
  t5id: 'demo-user-t5',
};

const STUDENT_IDS = Array.from({ length: 24 }, (_, i) => `demo-student-${i + 1}`);
const PARENT_IDS  = Array.from({ length: 10 }, (_, i) => `demo-parent-${i + 1}`);

// ─── Members ─────────────────────────────────────────────────────────────────
const TEACHER_NAMES = [
  'Dr. Sarah Mitchell', 'Mr. James Okonkwo', 'Ms. Elena Petrov',
  'Mr. David Chen', 'Mrs. Aoife Murphy',
];

const STUDENT_NAMES = [
  'Aiden Walsh', 'Beatrice Fontaine', 'Carlos Rivera', 'Diana Yun',
  'Ethan Kowalski', 'Fatima Al-Hassan', 'George Nakamura', 'Hannah Schmidt',
  'Isaac Ferreira', 'Jasmine Osei', 'Kieran Byrne', 'Lena Voronova',
  'Marcus Thompson', 'Nina Patel', 'Oliver Bergström', 'Priya Sharma',
  'Rafael Santos', 'Sophia Müller', 'Thomas Larsen', 'Uma Krishnan',
  'Victor Dubois', 'Wendy Okafor', 'Xavier Torres', 'Yuki Tanaka',
];

export function buildDemoMembers(schoolId) {
  const members = [];

  members.push({
    id: `mem-${D.admin}`, school_id: schoolId, user_id: D.admin,
    user_email: 'principal@westbridge.edu', user_name: 'Principal Jane Harrington',
    role: 'school_admin', status: 'active', department: 'Administration',
    created_at: '2025-08-01T09:00:00Z',
  });

  members.push({
    id: `mem-${D.coord}`, school_id: schoolId, user_id: D.coord,
    user_email: 'ib.coord@westbridge.edu', user_name: 'Dr. Rachel Kim',
    role: 'ib_coordinator', status: 'active', department: 'IB Programme',
    created_at: '2025-08-01T09:00:00Z',
  });

  const teacherEmails = [
    'sarah.mitchell@westbridge.edu', 'james.okonkwo@westbridge.edu',
    'elena.petrov@westbridge.edu', 'david.chen@westbridge.edu',
    'aoife.murphy@westbridge.edu',
  ];
  const teacherDepts = ['Sciences', 'Humanities', 'Languages', 'Mathematics', 'Sciences'];
  const teacherIds = [D.t1id, D.t2id, D.t3id, D.t4id, D.t5id];

  TEACHER_NAMES.forEach((name, i) => {
    members.push({
      id: `mem-${teacherIds[i]}`, school_id: schoolId, user_id: teacherIds[i],
      user_email: teacherEmails[i], user_name: name,
      role: 'teacher', status: 'active', department: teacherDepts[i],
      created_at: '2025-08-10T09:00:00Z',
    });
  });

  STUDENT_NAMES.forEach((name, i) => {
    const sid = STUDENT_IDS[i];
    members.push({
      id: `mem-${sid}`, school_id: schoolId, user_id: sid,
      user_email: `${name.toLowerCase().replace(/ /g, '.')}@student.westbridge.edu`,
      user_name: name,
      role: 'student', status: 'active',
      grade_level: i < 12 ? 'DP1' : 'DP2',
      created_at: '2025-09-01T09:00:00Z',
    });
  });

  PARENT_IDS.forEach((pid, i) => {
    members.push({
      id: `mem-${pid}`, school_id: schoolId, user_id: pid,
      user_email: `parent${i + 1}@family.com`,
      user_name: `Parent of ${STUDENT_NAMES[i * 2] || STUDENT_NAMES[i]}`,
      role: 'parent', status: 'active',
      created_at: '2025-09-03T09:00:00Z',
    });
  });

  return members;
}

// ─── Academic Structure ───────────────────────────────────────────────────────

export function buildDemoAcademicYears(schoolId) {
  return [{
    id: D.ay, school_id: schoolId, name: '2025–2026',
    start_date: '2025-09-01', end_date: '2026-06-19',
    is_current: true, status: 'active',
    created_at: '2025-08-01T09:00:00Z',
  }];
}

export function buildDemoTerms(schoolId) {
  return [
    {
      id: D.t1, school_id: schoolId, academic_year_id: D.ay,
      name: 'Term 1', start_date: '2025-09-01', end_date: '2025-12-19',
      is_current: false, created_at: '2025-08-01T09:00:00Z',
    },
    {
      id: D.t2, school_id: schoolId, academic_year_id: D.ay,
      name: 'Term 2', start_date: '2026-01-12', end_date: '2026-04-10',
      is_current: true, created_at: '2025-08-01T09:00:00Z',
    },
    {
      id: D.t3, school_id: schoolId, academic_year_id: D.ay,
      name: 'Term 3', start_date: '2026-04-27', end_date: '2026-06-19',
      is_current: false, created_at: '2025-08-01T09:00:00Z',
    },
  ];
}

export function buildDemoSubjects(schoolId) {
  return [
    { id: D.subMath,    school_id: schoolId, name: 'Mathematics Analysis & Approaches', code: 'MATH_AA', ib_group: 'group5_mathematics',    level: 'HL', status: 'active' },
    { id: D.subPhysics, school_id: schoolId, name: 'Physics',                            code: 'PHYS',    ib_group: 'group4_sciences',         level: 'HL', status: 'active' },
    { id: D.subHistory, school_id: schoolId, name: 'History',                            code: 'HIST',    ib_group: 'group3_individuals_societies', level: 'SL', status: 'active' },
    { id: D.subEnglish, school_id: schoolId, name: 'English A: Lang & Lit',              code: 'ENG_A',   ib_group: 'group1_language_literature',   level: 'HL', status: 'active' },
    { id: D.subBiology, school_id: schoolId, name: 'Biology',                            code: 'BIO',     ib_group: 'group4_sciences',         level: 'HL', status: 'active' },
    { id: D.subEcon,    school_id: schoolId, name: 'Economics',                          code: 'ECON',    ib_group: 'group3_individuals_societies', level: 'SL', status: 'active' },
    { id: D.subTOK,     school_id: schoolId, name: 'Theory of Knowledge',                code: 'TOK',     ib_group: 'core_tok',                level: 'core', status: 'active' },
  ];
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export function buildDemoClasses(schoolId) {
  const dp1 = STUDENT_IDS.slice(0, 12);
  const dp2 = STUDENT_IDS.slice(12, 24);
  return [
    {
      id: D.cls1, school_id: schoolId, academic_year_id: D.ay,
      name: 'Math AA HL — DP1', section: 'A', subject_id: D.subMath,
      teacher_ids: [D.t4id], primary_teacher_id: D.t4id,
      student_ids: dp1, status: 'active', capacity: 15,
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cls2, school_id: schoolId, academic_year_id: D.ay,
      name: 'Math AA HL — DP2', section: 'B', subject_id: D.subMath,
      teacher_ids: [D.t4id], primary_teacher_id: D.t4id,
      student_ids: dp2, status: 'active', capacity: 15,
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cls3, school_id: schoolId, academic_year_id: D.ay,
      name: 'Physics HL', section: 'A', subject_id: D.subPhysics,
      teacher_ids: [D.t1id], primary_teacher_id: D.t1id,
      student_ids: [...dp1.slice(0, 8), ...dp2.slice(0, 6)], status: 'active', capacity: 16,
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cls4, school_id: schoolId, academic_year_id: D.ay,
      name: 'History SL', section: 'A', subject_id: D.subHistory,
      teacher_ids: [D.t2id], primary_teacher_id: D.t2id,
      student_ids: [...dp1.slice(4, 12), ...dp2.slice(4, 12)], status: 'active', capacity: 18,
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cls5, school_id: schoolId, academic_year_id: D.ay,
      name: 'English A HL', section: 'A', subject_id: D.subEnglish,
      teacher_ids: [D.t3id], primary_teacher_id: D.t3id,
      student_ids: STUDENT_IDS.slice(0, 18), status: 'active', capacity: 20,
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cls6, school_id: schoolId, academic_year_id: D.ay,
      name: 'Biology HL', section: 'A', subject_id: D.subBiology,
      teacher_ids: [D.t1id, D.t5id], primary_teacher_id: D.t1id,
      student_ids: [...dp1.slice(0, 6), ...dp2.slice(0, 8)], status: 'active', capacity: 16,
      created_at: '2025-09-01T09:00:00Z',
    },
  ];
}

// ─── Cohorts ──────────────────────────────────────────────────────────────────

export function buildDemoCohorts(schoolId) {
  return [
    {
      id: D.cohortDP1, school_id: schoolId, name: 'DP1 2025–2026',
      academic_year_id: D.ay, grade_level: 'DP1',
      student_ids: STUDENT_IDS.slice(0, 12), status: 'active',
      created_at: '2025-09-01T09:00:00Z',
    },
    {
      id: D.cohortDP2, school_id: schoolId, name: 'DP2 2025–2026',
      academic_year_id: D.ay, grade_level: 'DP2',
      student_ids: STUDENT_IDS.slice(12, 24), status: 'active',
      created_at: '2025-09-01T09:00:00Z',
    },
  ];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function buildDemoAttendance(schoolId) {
  const records = [];
  const classStudentMap = {
    [D.cls1]: STUDENT_IDS.slice(0, 12),
    [D.cls2]: STUDENT_IDS.slice(12, 24),
    [D.cls3]: [...STUDENT_IDS.slice(0, 8), ...STUDENT_IDS.slice(12, 18)],
    [D.cls4]: [...STUDENT_IDS.slice(4, 12), ...STUDENT_IDS.slice(16, 24)],
    [D.cls5]: STUDENT_IDS.slice(0, 18),
    [D.cls6]: [...STUDENT_IDS.slice(0, 6), ...STUDENT_IDS.slice(12, 20)],
  };

  // Generate last 40 days (5 days/week pattern)
  const absentStudents = new Set(['demo-student-3', 'demo-student-7', 'demo-student-15']);

  for (let dayOffset = 39; dayOffset >= 0; dayOffset--) {
    const date = new Date(NOW);
    date.setDate(date.getDate() - dayOffset);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const dateStr = date.toISOString().slice(0, 10);

    Object.entries(classStudentMap).forEach(([classId, studentIds], ci) => {
      // Alternate which classes meet on which days
      if ((ci % 2 === 0 && dow % 2 === 0) || (ci % 2 === 1 && dow % 2 === 1)) return;

      studentIds.forEach((sid, si) => {
        const isAbsent = absentStudents.has(sid) && Math.random() < 0.3;
        const isLate = !isAbsent && Math.random() < 0.05;
        records.push({
          id: `att-${classId}-${sid}-${dateStr}`,
          school_id: schoolId, class_id: classId, student_id: sid,
          student_name: STUDENT_NAMES[STUDENT_IDS.indexOf(sid)] || 'Student',
          date: dateStr,
          status: isAbsent ? 'absent' : isLate ? 'late' : 'present',
          recorded_by: D.coord,
          created_at: `${dateStr}T09:30:00Z`,
        });
      });
    });
  }
  return records;
}

// ─── Grade Items ──────────────────────────────────────────────────────────────

export function buildDemoGrades(schoolId) {
  const grades = [];
  const assignments = [
    { title: 'Calculus Test 1', classId: D.cls1, max: 100, baseScore: 72 },
    { title: 'Calculus Test 1', classId: D.cls2, max: 100, baseScore: 78 },
    { title: 'Vectors Assignment', classId: D.cls1, max: 50, baseScore: 38 },
    { title: 'Mechanics Lab Report', classId: D.cls3, max: 30, baseScore: 22 },
    { title: 'Wave Properties Quiz', classId: D.cls3, max: 20, baseScore: 15 },
    { title: 'Essay: Cold War Origins', classId: D.cls4, max: 25, baseScore: 18 },
    { title: 'Oral Commentary', classId: D.cls5, max: 30, baseScore: 24 },
    { title: 'Written Task 1', classId: D.cls5, max: 20, baseScore: 15 },
    { title: 'Cell Biology Lab', classId: D.cls6, max: 24, baseScore: 18 },
  ];

  const classes = buildDemoClasses(schoolId);
  const classMap = Object.fromEntries(classes.map(c => [c.id, c]));

  assignments.forEach((asgn, ai) => {
    const cls = classMap[asgn.classId];
    if (!cls) return;
    cls.student_ids.forEach((sid, si) => {
      const variance = (Math.random() - 0.5) * 20;
      const rawScore = Math.max(0, Math.min(asgn.max, Math.round(asgn.baseScore + variance)));
      const studentIdx = STUDENT_IDS.indexOf(sid);
      grades.push({
        id: `grade-${ai}-${sid}`,
        school_id: schoolId, class_id: asgn.classId,
        student_id: sid,
        student_name: STUDENT_NAMES[studentIdx] || 'Student',
        title: asgn.title,
        score: rawScore, max_score: asgn.max,
        percentage: Math.round((rawScore / asgn.max) * 100),
        ib_grade: rawScore / asgn.max >= 0.85 ? 7 : rawScore / asgn.max >= 0.7 ? 6 : rawScore / asgn.max >= 0.55 ? 5 : rawScore / asgn.max >= 0.45 ? 4 : 3,
        status: 'published',
        visible_to_student: true, visible_to_parent: true,
        term_id: D.t2, grading_type: 'simple',
        created_at: '2026-02-15T10:00:00Z',
      });
    });
  });
  return grades;
}

// ─── Predicted Grades ─────────────────────────────────────────────────────────

export function buildDemoPredictedGrades(schoolId) {
  const grades = [];
  const ibGrades = [4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 7, 5, 5, 6, 6, 4, 5, 6, 7, 5, 6, 7, 5];
  STUDENT_IDS.forEach((sid, i) => {
    grades.push({
      id: `pg-${sid}`, school_id: schoolId, student_id: sid,
      subject_id: D.subMath, class_id: i < 12 ? D.cls1 : D.cls2,
      predicted_ib_grade: ibGrades[i] || 5,
      status: 'published', term_id: D.t2,
      created_at: '2026-03-01T10:00:00Z',
    });
  });
  return grades;
}

// ─── Behavior ─────────────────────────────────────────────────────────────────

export function buildDemoBehavior(schoolId) {
  const records = [
    { student: 0, type: 'positive', category: 'academic', title: 'Outstanding Essay Submission', severity: null },
    { student: 1, type: 'positive', category: 'participation', title: 'Excellent Class Contribution', severity: null },
    { student: 2, type: 'concern', category: 'attendance_related', title: 'Repeated Late Arrivals', severity: 'low' },
    { student: 4, type: 'positive', category: 'achievement', title: 'Maths Olympiad Finalist', severity: null },
    { student: 6, type: 'incident', category: 'conduct', title: 'Disruption During Exam', severity: 'medium' },
    { student: 7, type: 'concern', category: 'academic', title: 'Missing Multiple Assignments', severity: 'medium' },
    { student: 9, type: 'positive', category: 'social', title: 'Outstanding Peer Mentoring', severity: null },
    { student: 11, type: 'note', category: 'other', title: 'Meeting with Parents Scheduled', severity: null },
    { student: 13, type: 'positive', category: 'achievement', title: 'Science Fair Winner', severity: null },
    { student: 14, type: 'concern', category: 'academic', title: 'Grade Decline in Physics', severity: 'low' },
    { student: 15, type: 'incident', category: 'safety', title: 'Lab Safety Violation', severity: 'high' },
    { student: 16, type: 'positive', category: 'participation', title: 'Model UN Best Delegate', severity: null },
    { student: 18, type: 'note', category: 'other', title: 'EE Extension Granted', severity: null },
    { student: 20, type: 'concern', category: 'social', title: 'Peer Conflict — Resolved', severity: 'low' },
    { student: 22, type: 'positive', category: 'achievement', title: 'CAS Project Award', severity: null },
  ];

  const teacherIds = [D.t1id, D.t2id, D.t3id, D.t4id, D.t5id];

  return records.map((r, i) => ({
    id: `beh-${i}`,
    school_id: schoolId,
    student_id: STUDENT_IDS[r.student],
    student_name: STUDENT_NAMES[r.student],
    recorded_by: teacherIds[i % teacherIds.length],
    recorded_by_name: TEACHER_NAMES[i % TEACHER_NAMES.length],
    type: r.type, category: r.category, title: r.title,
    date: new Date(NOW.getTime() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    severity: r.severity,
    visible_to_student: r.type === 'positive',
    visible_to_parent: r.type === 'positive',
    staff_only: r.type === 'incident',
    follow_up_required: r.type === 'incident' || r.type === 'concern',
    follow_up_completed: r.type === 'concern' && i % 2 === 0,
    pastoral_reviewed: r.severity === 'high',
    created_at: new Date(NOW.getTime() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function buildDemoMessages(schoolId) {
  const msgs = [];
  const senders = [D.coord, D.admin, D.t1id, D.t2id, D.t3id];
  const senderNames = ['Dr. Rachel Kim', 'Principal Jane Harrington', ...TEACHER_NAMES.slice(0, 3)];
  const subjects = [
    'Term 2 Assessment Schedule', 'Parent Evening – April 3rd', 'CAS Deadline Reminder',
    'EE First Draft Submission', 'Predicted Grades Update', 'TOK Exhibition – Planning',
    'Maths Study Support Sessions', 'Science Lab Booking', 'English Mock Exam Prep',
    'School Trip – Permission Slips', 'DP2 University Counselling', 'Holiday Reading List',
  ];

  for (let i = 0; i < 47; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const date = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    msgs.push({
      id: `msg-${i}`,
      school_id: schoolId,
      sender_id: senders[i % senders.length],
      sender_name: senderNames[i % senderNames.length],
      sender_role: i < 2 ? 'ib_coordinator' : 'teacher',
      recipient_ids: STUDENT_IDS.slice(0, 12 + (i % 12)),
      subject: subjects[i % subjects.length],
      body: 'Please review the attached information and respond by the stated deadline.',
      is_announcement: i % 4 === 0,
      is_school_wide: i % 8 === 0,
      read_by: STUDENT_IDS.slice(0, Math.floor(Math.random() * 12)),
      created_at: date.toISOString(),
    });
  }
  return msgs;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export function buildDemoAssignments(schoolId) {
  const dueDate = (daysFromNow) => new Date(NOW.getTime() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
  return [
    { id: 'asgn-1', school_id: schoolId, class_id: D.cls1, teacher_id: D.t4id, title: 'Calculus Integration — Problem Set', type: 'homework', status: 'published', due_date: dueDate(5), max_score: 50, created_at: '2026-03-10T09:00:00Z' },
    { id: 'asgn-2', school_id: schoolId, class_id: D.cls3, teacher_id: D.t1id, title: 'Optics Lab Report', type: 'lab_report', status: 'published', due_date: dueDate(10), max_score: 24, created_at: '2026-03-12T09:00:00Z' },
    { id: 'asgn-3', school_id: schoolId, class_id: D.cls4, teacher_id: D.t2id, title: 'Cold War Extended Essay Draft', type: 'essay', status: 'published', due_date: dueDate(14), max_score: 30, created_at: '2026-03-08T09:00:00Z' },
    { id: 'asgn-4', school_id: schoolId, class_id: D.cls5, teacher_id: D.t3id, title: 'Individual Oral Commentary', type: 'presentation', status: 'published', due_date: dueDate(7), max_score: 20, created_at: '2026-03-15T09:00:00Z' },
    { id: 'asgn-5', school_id: schoolId, class_id: D.cls2, teacher_id: D.t4id, title: 'Statistics Practice Exam', type: 'exam', status: 'published', due_date: dueDate(-2), max_score: 100, created_at: '2026-03-01T09:00:00Z' },
    { id: 'asgn-6', school_id: schoolId, class_id: D.cls6, teacher_id: D.t1id, title: 'Ecology Field Report', type: 'lab_report', status: 'published', due_date: dueDate(21), max_score: 30, created_at: '2026-03-18T09:00:00Z' },
  ];
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export function buildDemoSubmissions(schoolId) {
  const subs = [];
  const classes = buildDemoClasses(schoolId);
  const classMap = Object.fromEntries(classes.map(c => [c.id, c]));
  const assignments = buildDemoAssignments(schoolId);

  assignments.forEach(asgn => {
    const cls = classMap[asgn.class_id];
    if (!cls) return;
    cls.student_ids.forEach((sid, i) => {
      // ~88% submission rate
      if (Math.random() < 0.12) return;
      const score = Math.round((0.55 + Math.random() * 0.35) * asgn.max_score);
      subs.push({
        id: `sub-${asgn.id}-${sid}`,
        school_id: schoolId, assignment_id: asgn.id,
        class_id: asgn.class_id, student_id: sid,
        student_name: STUDENT_NAMES[STUDENT_IDS.indexOf(sid)] || 'Student',
        status: i % 10 === 0 ? 'late' : Math.random() < 0.6 ? 'graded' : 'submitted',
        score: Math.random() < 0.6 ? score : null,
        submitted_at: new Date(NOW.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(NOW.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });
  });
  return subs;
}

// ─── Timetable Syncs ─────────────────────────────────────────────────────────

export function buildDemoTimetableSyncs(schoolId) {
  return [
    { id: 'sync-1', school_id: schoolId, status: 'success', last_synced_at: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(), records_synced: 48, created_at: '2026-03-22T08:00:00Z' },
  ];
}

// ─── Pre-computed Operations Data ────────────────────────────────────────────

export function buildDemoOperationsData(schoolId, school) {
  const members = buildDemoMembers(schoolId);
  const classes = buildDemoClasses(schoolId);
  const academicYears = buildDemoAcademicYears(schoolId);
  const terms = buildDemoTerms(schoolId);
  const subjects = buildDemoSubjects(schoolId);
  const attendance = buildDemoAttendance(schoolId);
  const assignments = buildDemoAssignments(schoolId);
  const submissions = buildDemoSubmissions(schoolId);
  const messages = buildDemoMessages(schoolId);

  const students = members.filter(m => m.role === 'student');
  const teachers = members.filter(m => ['teacher', 'ib_coordinator'].includes(m.role));
  const parents = members.filter(m => m.role === 'parent');

  const enrolledStudentIds = new Set(classes.flatMap(c => c.student_ids || []));
  const studentsWithoutClasses = students.filter(s => !enrolledStudentIds.has(s.user_id));

  const thirtyDaysAgo = new Date(NOW);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);
  const presentCount = recentAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = recentAttendance.length > 0 ? Math.round((presentCount / recentAttendance.length) * 100) : null;

  const publishedAssignments = assignments.filter(a => a.status === 'published');
  let missingCount = 0;
  let expectedSubmissions = 0;
  publishedAssignments.forEach(a => {
    const classObj = classes.find(c => c.id === a.class_id);
    if (!classObj) return;
    const studentCount = (classObj.student_ids || []).length;
    expectedSubmissions += studentCount;
    const submitted = submissions.filter(s => s.assignment_id === a.id && ['submitted', 'graded', 'returned', 'late', 'resubmitted'].includes(s.status)).length;
    missingCount += Math.max(0, studentCount - submitted);
  });
  const missingWorkRate = expectedSubmissions > 0 ? Math.round((missingCount / expectedSubmissions) * 100) : null;

  const recentMessages = messages.filter(m => new Date(m.created_at) >= thirtyDaysAgo);

  const now = new Date(NOW);
  const upcomingTerms = terms.filter(t => t.end_date && new Date(t.end_date) >= now)
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .slice(0, 2);

  return {
    school: school || { id: schoolId, name: 'Westbridge International School', plan: 'growth', status: 'active', billing_status: 'active', curriculum: 'ib_dp' },
    members: { students, teachers, parents, total: members.length },
    classes,
    setupSteps: { academicYears: true, terms: true, subjects: true, classes: true, staff: true },
    setupDone: 5,
    setupTotal: 5,
    studentsWithoutClasses,
    classesWithoutTeachers: [],
    failedSyncs: [],
    attendanceRate,
    recentAttendanceCount: recentAttendance.length,
    missingWorkRate,
    missingCount,
    messagingVolume: recentMessages.length,
    upcomingTerms,
    subjects,
    academicYears,
    terms,
  };
}

// ─── Per-user cache helpers ──────────────────────────────────────────────────

const TEACHER_IDS = [D.t1id, D.t2id, D.t3id, D.t4id, D.t5id];

function getTeacherClasses(classes, teacherId) {
  return classes.filter(c => c.teacher_ids?.includes(teacherId));
}

function getStudentClasses(classes, studentId) {
  return classes.filter(c => c.student_ids?.includes(studentId));
}

// ─── Cache Seeder ─────────────────────────────────────────────────────────────

export function seedDemoQueryCache(queryClient, schoolId, school) {
  const FAR_FUTURE = Date.now() + 1000 * 60 * 60 * 24; // 24 hours from now

  const members      = buildDemoMembers(schoolId);
  const classes      = buildDemoClasses(schoolId);
  const subjects     = buildDemoSubjects(schoolId);
  const academicYears = buildDemoAcademicYears(schoolId);
  const terms        = buildDemoTerms(schoolId);
  const cohorts      = buildDemoCohorts(schoolId);
  const attendance   = buildDemoAttendance(schoolId);
  const grades       = buildDemoGrades(schoolId);
  const predictedGrades = buildDemoPredictedGrades(schoolId);
  const behavior     = buildDemoBehavior(schoolId);
  const messages     = buildDemoMessages(schoolId);
  const assignments  = buildDemoAssignments(schoolId);
  const submissions  = buildDemoSubmissions(schoolId);
  const timetableSyncs = buildDemoTimetableSyncs(schoolId);
  const operationsData = buildDemoOperationsData(schoolId, school);

  const opts = { updatedAt: FAR_FUTURE };

  // Core dashboard
  queryClient.setQueryData(['school-operations', schoolId], operationsData, opts);

  // Users / classes
  queryClient.setQueryData(['school-memberships', schoolId], members, opts);
  queryClient.setQueryData(['school-classes', schoolId], classes, opts);
  queryClient.setQueryData(['school-subjects', schoolId], subjects, opts);
  queryClient.setQueryData(['academic-years', schoolId], academicYears, opts);
  queryClient.setQueryData(['cohorts', schoolId], cohorts, opts);
  queryClient.setQueryData(['school-terms', schoolId], terms, opts);

  // Analytics
  queryClient.setQueryData(['analytics-memberships', schoolId], members, opts);
  queryClient.setQueryData(['analytics-classes', schoolId], classes, opts);
  queryClient.setQueryData(['analytics-grades-school', schoolId], grades, opts);
  queryClient.setQueryData(['analytics-attendance-school', schoolId], attendance, opts);
  queryClient.setQueryData(['analytics-cohorts', schoolId], cohorts, opts);
  queryClient.setQueryData(['analytics-pg', schoolId], predictedGrades, opts);
  queryClient.setQueryData(['analytics-behavior', schoolId], behavior, opts);

  // Attendance admin
  queryClient.setQueryData(['attendance-records', schoolId], attendance, opts);
  queryClient.setQueryData(['school-attendance', schoolId], attendance, opts);

  // Behavior admin
  queryClient.setQueryData(['behavior-records', schoolId], behavior, opts);
  queryClient.setQueryData(['school-behavior', schoolId], behavior, opts);

  // Assignments / submissions / grades
  queryClient.setQueryData(['school-assignments', schoolId], assignments, opts);
  queryClient.setQueryData(['school-submissions', schoolId], submissions, opts);
  queryClient.setQueryData(['grade-items', schoolId], grades, opts);
  queryClient.setQueryData(['predicted-grades', schoolId], predictedGrades, opts);

  // Messaging
  queryClient.setQueryData(['messages', schoolId], messages, opts);
  queryClient.setQueryData(['school-messages', schoolId], messages, opts);

  // Timetable
  queryClient.setQueryData(['timetable-syncs', schoolId], timetableSyncs, opts);

  // Invitations (empty — realistic for a demo)
  queryClient.setQueryData(['user-invitations', schoolId], [], opts);

  // ── Teacher-specific query keys ──
  TEACHER_IDS.forEach(tid => {
    const myClasses = getTeacherClasses(classes, tid);
    const myAssignments = assignments.filter(a => a.teacher_id === tid);
    const myClassIds = new Set(myClasses.map(c => c.id));
    const mySubmissions = submissions.filter(s => myClassIds.has(s.class_id));
    queryClient.setQueryData(['teacher-classes', schoolId, tid], myClasses, opts);
    queryClient.setQueryData(['teacher-assignments', schoolId, tid], myAssignments, opts);
    queryClient.setQueryData(['teacher-submissions', schoolId, tid], mySubmissions, opts);
  });

  // ── Student-specific query keys ──
  STUDENT_IDS.forEach(sid => {
    const myClasses = getStudentClasses(classes, sid);
    const myClassIds = new Set(myClasses.map(c => c.id));
    const myAssignments = assignments.filter(a => myClassIds.has(a.class_id));
    const myGrades = grades.filter(g => g.student_id === sid && g.visible_to_student);
    const myAttendance = attendance.filter(a => a.student_id === sid);
    const myBehavior = behavior.filter(b => b.student_id === sid && b.visible_to_student);
    queryClient.setQueryData(['student-classes', schoolId, sid], myClasses, opts);
    queryClient.setQueryData(['student-assignments', schoolId, sid], myAssignments, opts);
    queryClient.setQueryData(['student-grades', schoolId, sid], myGrades, opts);
    queryClient.setQueryData(['student-attendance', schoolId, sid], myAttendance, opts);
    queryClient.setQueryData(['student-behavior', schoolId, sid], myBehavior, opts);
  });
}

export function clearDemoQueryCache(queryClient, schoolId) {
  // Remove all cached queries that contain the schoolId — covers every demo-seeded key
  queryClient.removeQueries({
    predicate: (query) => query.queryKey.includes(schoolId),
  });
}