/**
 * The seeded school for `npm run dev:fake`.
 *
 * Invented, and it must stay invented: these rows end up in screenshots, and a
 * real school's name in a screenshot implies they are a customer.
 *
 * Deterministic on purpose (no Math.random) so that two people looking at the
 * same screen see the same numbers.
 */

const SCHOOL_ID = 'f0000000-0000-4000-8000-000000000001';
const YEAR_ID = 'f0000000-0000-4000-8000-0000000000a1';
const TERM_ID = 'f0000000-0000-4000-8000-0000000000b1';

const id = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const USERS = {
  teacher: { id: id('f1000000', 1), email: 'aoife.brennan@example.test', full_name: 'Aoife Brennan', role: 'teacher' },
  school_admin: { id: id('f1000000', 2), email: 'admin@example.test', full_name: 'Declan Murphy', role: 'school_admin' },
  coteacher: { id: id('f1000000', 3), email: 'tomas.ruiz@example.test', full_name: 'Tomás Ruiz', role: 'teacher' },
};

const STUDENT_NAMES = [
  'Amara Osei', 'Tomás Rivera', 'Yuki Tanaka', 'Léa Moreau', 'Noah Weiss', 'Priya Shah',
  'Kenji Ito', 'Sofia Oliveira', 'Finn Gallagher', 'Maya Cohen', 'Elias Berg', 'Zara Ahmed',
  'Luca Romano', 'Hana Kim', 'Oisín Walsh', 'Isabel Duarte', 'Ravi Menon', 'Chloé Martin',
  'Jonas Fischer', 'Aisha Bello',
];

const students = STUDENT_NAMES.map((full_name, i) => ({
  id: id('f2000000', i + 1),
  email: `${full_name.toLowerCase().normalize('NFKD').replace(/[^\w ]/g, '').replace(/ /g, '.')}@example.test`,
  full_name,
  role: 'student',
}));
USERS.student = students[0];

const iso = (daysFromNow, hour = 9) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};
const dateOnly = (daysFromNow) => iso(daysFromNow).slice(0, 10);

export function seed() {
  const t = USERS.teacher;
  const school = {
    id: SCHOOL_ID, name: 'Glenmore International School', slug: 'glenmore', country: 'Ireland', city: 'Galway',
    curriculum: 'ib_dp', plan: 'growth', status: 'active', max_students: 400, timezone: 'Europe/Dublin',
    academic_year_start_month: 8, modules_enabled: [], created_at: iso(-200),
  };

  const allPeople = [t, USERS.school_admin, USERS.coteacher, ...students];
  const profiles = allPeople.map((u) => ({
    id: u.id, email: u.email, full_name: u.full_name, display_name: null, role: u.role,
    active_school_id: SCHOOL_ID, created_at: iso(-150),
  }));
  const memberships = allPeople.map((u, i) => ({
    id: id('f3000000', i + 1), user_id: u.id, user_email: u.email, user_name: u.full_name,
    school_id: SCHOOL_ID, role: u.role, status: 'active', created_at: iso(-150),
  }));

  const subjects = [
    { id: id('f4000000', 1), school_id: SCHOOL_ID, name: 'Biology', code: 'BIO', ib_group: 'group_4', level: 'HL', status: 'active' },
    { id: id('f4000000', 2), school_id: SCHOOL_ID, name: 'Chemistry', code: 'CHEM', ib_group: 'group_4', level: 'SL', status: 'active' },
    { id: id('f4000000', 3), school_id: SCHOOL_ID, name: 'Theory of Knowledge', code: 'TOK', ib_group: 'core', level: null, status: 'active' },
  ];

  const sid = (n) => students[n].id;
  const classes = [
    {
      id: id('f5000000', 1), school_id: SCHOOL_ID, subject_id: subjects[0].id, academic_year_id: YEAR_ID,
      name: 'Biology HL — DP2', section: 'A', capacity: 16, room: 'Lab 3', schedule_info: 'Mon, Wed, Fri',
      teacher_ids: [t.id], primary_teacher_id: t.id, student_ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(sid),
      status: 'active', roster_locked: false, created_at: iso(-120),
    },
    {
      id: id('f5000000', 2), school_id: SCHOOL_ID, subject_id: subjects[1].id, academic_year_id: YEAR_ID,
      name: 'Chemistry SL — DP1', section: 'B', capacity: 18, room: 'Lab 1', schedule_info: 'Tue, Thu',
      teacher_ids: [t.id, USERS.coteacher.id], primary_teacher_id: t.id, student_ids: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(sid),
      status: 'active', roster_locked: false, created_at: iso(-120),
    },
    {
      id: id('f5000000', 3), school_id: SCHOOL_ID, subject_id: subjects[2].id, academic_year_id: YEAR_ID,
      name: 'Theory of Knowledge — DP1', section: null, capacity: 24, room: 'A101', schedule_info: 'Thu',
      teacher_ids: [t.id], primary_teacher_id: t.id, student_ids: [12, 13, 14, 15, 16, 17, 18, 19].map(sid),
      status: 'active', roster_locked: false, created_at: iso(-120),
    },
  ];

  const A = (n, cls, title, type, due, extra = {}) => ({
    id: id('f6000000', n), school_id: SCHOOL_ID, class_id: cls.id, teacher_id: t.id, title, type,
    description: extra.description ?? '', due_date: iso(due, 16), publish_date: iso(due - 10),
    max_score: extra.max_score ?? 20, status: extra.status ?? 'published', allow_late: true,
    primary_submission_format: 'file_upload', attachments: [], ib_criteria: [], created_at: iso(due - 12),
  });
  const [bio, chem, tok] = classes;
  const assignments = [
    A(1, bio, 'Enzyme kinetics — lab report', 'lab_report', -2, { description: 'Write up the catalase practical. Criteria A–D.', max_score: 24 }),
    A(2, bio, 'Cell respiration quiz', 'quiz', -9, { max_score: 15 }),
    A(3, bio, 'IA research question draft', 'essay', 5),
    A(4, chem, 'Stoichiometry problem set', 'homework', -1),
    A(5, chem, 'Titration practical write-up', 'lab_report', 8, { max_score: 24 }),
    A(6, tok, 'Knowledge question presentation', 'presentation', 12, { max_score: 10 }),
    A(7, chem, 'Bonding mock test', 'exam', 15, { status: 'draft', max_score: 40 }),
  ];

  // Submissions: for past-due work, most students submitted, a few late, some
  // already graded, a couple missing — the mix a real marking queue has.
  const submissions = [];
  const grade_items = [];
  let s = 1;
  for (const a of assignments.filter((x) => new Date(x.due_date) < new Date())) {
    const cls = classes.find((c) => c.id === a.class_id);
    cls.student_ids.forEach((stId, i) => {
      const st = students.find((x) => x.id === stId);
      if (i % 6 === 5) return; // missing
      const late = i % 5 === 3;
      const graded = a.id === assignments[1].id || i % 4 === 0;
      const score = Math.round(a.max_score * (0.55 + ((i * 7) % 40) / 100));
      submissions.push({
        id: id('f7000000', s++), school_id: SCHOOL_ID, assignment_id: a.id, class_id: cls.id, student_id: stId,
        student_name: st.full_name,
        content: i % 3 === 0 ? 'Rate of reaction rose with substrate concentration until about 2.5 mol/dm³, then levelled off as the active sites saturated.' : '',
        link_url: i % 3 === 1 ? 'https://docs.example.test/enzyme-report' : null,
        file_urls: [], documents: [], version_number: i % 7 === 2 ? 2 : 1,
        is_current_version: true, status: graded ? 'graded' : late ? 'late' : 'submitted',
        submitted_at: iso(late ? 0 : -3, 14 + (i % 4)), score: graded ? score : null,
        feedback: graded ? 'Clear method. Tighten the evaluation of uncertainty.' : null,
        graded_at: graded ? iso(-1) : null, created_at: iso(-3),
      });
      if (graded) {
        grade_items.push({
          id: id('f8000000', grade_items.length + 1), school_id: SCHOOL_ID, class_id: cls.id, student_id: stId,
          student_name: st.full_name, assignment_id: a.id, title: a.title, score, max_score: a.max_score,
          percentage: Math.round((score / a.max_score) * 100), ib_grade: Math.max(1, Math.min(7, Math.round((score / a.max_score) * 7))),
          comment: null, status: 'published', visible_to_student: true, visible_to_parent: true, term_id: TERM_ID,
          grading_type: 'simple', is_template: false, created_at: iso(-1),
        });
      }
    });
  }

  // Attendance for the last five school days in every class.
  const attendance_records = [];
  let ar = 1;
  for (let back = 1; back <= 7; back++) {
    const d = new Date(); d.setDate(d.getDate() - back);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const cls of classes) {
      cls.student_ids.forEach((stId, i) => {
        const st = students.find((x) => x.id === stId);
        const status = (i + back) % 11 === 0 ? 'absent' : (i + back) % 7 === 0 ? 'late' : 'present';
        attendance_records.push({
          id: id('f9000000', ar++), school_id: SCHOOL_ID, class_id: cls.id, student_id: stId, student_name: st.full_name,
          date: dateOnly(-back), status, recorded_by: t.full_name, created_at: iso(-back),
        });
      });
    }
  }

  // Today's timetable, on whatever weekday "today" is.
  const dow = new Date().getDay();
  const SE = (n, cls, start, end, room) => ({
    id: id('fa000000', n), school_id: SCHOOL_ID, class_id: cls.id, class_name: cls.name, teacher_id: t.id,
    teacher_name: t.full_name, room_name: room, day_of_week: dow, start_time: start, end_time: end, status: 'active',
  });
  const schedule_entries = [
    SE(1, bio, '08:30', '09:20', 'Lab 3'),
    SE(2, chem, '10:00', '10:50', 'Lab 1'),
    SE(3, tok, '13:30', '14:20', 'A101'),
  ];

  const class_materials = [
    {
      id: id('fb000000', 1), school_id: SCHOOL_ID, class_id: bio.id, title: 'Catalase practical — method sheet',
      type: 'link', url: 'https://example.test/catalase-method', uploaded_by_id: t.id, uploaded_by_name: t.full_name, created_at: iso(-14),
    },
  ];

  return {
    tables: {
      schools: [school],
      profiles,
      school_memberships: memberships,
      subjects,
      academic_years: [{ id: YEAR_ID, school_id: SCHOOL_ID, name: '2026–2027', start_date: '2026-08-26', end_date: '2027-06-18', is_current: true, status: 'active' }],
      terms: [{ id: TERM_ID, school_id: SCHOOL_ID, academic_year_id: YEAR_ID, name: 'Autumn term', start_date: '2026-08-26', end_date: '2026-12-18', is_current: true, status: 'active' }],
      classes,
      assignments,
      submissions,
      grade_items,
      attendance_records,
      schedule_entries,
      class_materials,
    },
  };
}
