// Shared mock data for the Scholr demo sandbox. All roles read from here.
// No auth, no network — pure client-side.

export const SCHOOL = {
  name: 'Meridian International Academy',
  city: 'Geneva',
  country: 'Switzerland',
  curriculum: 'IB Diploma Programme',
  academicYear: '2025–2026',
  termName: 'Term 2',
};

export const SUBJECTS = [
  { id: 'math_hl', name: 'Mathematics AA HL', color: 'bg-sky-500' },
  { id: 'eng_lit', name: 'English Literature HL', color: 'bg-rose-500' },
  { id: 'bio_hl', name: 'Biology HL', color: 'bg-emerald-500' },
  { id: 'history_sl', name: 'History SL', color: 'bg-amber-500' },
  { id: 'econ_sl', name: 'Economics SL', color: 'bg-violet-500' },
  { id: 'fre_b', name: 'French B SL', color: 'bg-cyan-500' },
];

export const STUDENT = {
  id: 'stu_01',
  name: 'Amélie Laurent',
  grade: 'DP2',
  advisor: 'Mr. Harrow',
  avatarInitials: 'AL',
};

export const TEACHER = {
  id: 'tch_01',
  name: 'Dr. Sarah Chen',
  department: 'Sciences',
  avatarInitials: 'SC',
  classes: ['Biology HL — DP2', 'Biology HL — DP1', 'TOK — DP2'],
};

export const PARENT = {
  id: 'par_01',
  name: 'Elena Laurent',
  avatarInitials: 'EL',
  children: [
    { id: 'stu_01', name: 'Amélie Laurent', grade: 'DP2' },
    { id: 'stu_02', name: 'Thomas Laurent', grade: 'MYP4' },
  ],
};

export const LEADER = {
  id: 'adm_01',
  name: 'Dr. James Okonkwo',
  title: 'Head of School',
  avatarInitials: 'JO',
};

export const GRADES = [
  { subject: 'Mathematics AA HL', current: 6, predicted: 7, trend: 'up' },
  { subject: 'English Literature HL', current: 6, predicted: 6, trend: 'flat' },
  { subject: 'Biology HL', current: 7, predicted: 7, trend: 'up' },
  { subject: 'History SL', current: 5, predicted: 6, trend: 'up' },
  { subject: 'Economics SL', current: 6, predicted: 6, trend: 'flat' },
  { subject: 'French B SL', current: 5, predicted: 5, trend: 'down' },
];

export const UPCOMING_ASSIGNMENTS = [
  { id: 'a1', title: 'Calculus Problem Set 7', subject: 'Mathematics AA HL', dueIn: 'Tomorrow', status: 'not_started' },
  { id: 'a2', title: 'Lab Report: Enzyme Kinetics', subject: 'Biology HL', dueIn: 'In 3 days', status: 'in_progress' },
  { id: 'a3', title: 'Literary Analysis — Beloved', subject: 'English Literature HL', dueIn: 'In 5 days', status: 'not_started' },
  { id: 'a4', title: 'Cold War Source Analysis', subject: 'History SL', dueIn: 'Next week', status: 'in_progress' },
];

export const TIMETABLE_TODAY = [
  { time: '08:30 – 09:45', subject: 'Mathematics AA HL', room: 'B-204', teacher: 'Ms. Patel' },
  { time: '10:00 – 11:15', subject: 'Biology HL', room: 'Lab 3', teacher: 'Dr. Chen' },
  { time: '11:30 – 12:45', subject: 'English Literature HL', room: 'A-108', teacher: 'Mr. Harrow' },
  { time: '13:45 – 15:00', subject: 'History SL', room: 'C-301', teacher: 'Ms. Novak' },
  { time: '15:15 – 16:30', subject: 'TOK', room: 'A-201', teacher: 'Dr. Chen' },
];

export const ATTENDANCE = {
  present: 94,
  absent: 3,
  late: 3,
  last30Days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i === 6 || i === 19 ? 'late' : i === 13 ? 'absent' : 'present',
  })),
};

export const ANNOUNCEMENTS = [
  { id: 'n1', title: 'Mock exam schedule published', from: 'DP Coordinator', when: '2h ago' },
  { id: 'n2', title: 'CAS reflection due Friday', from: 'Ms. Novak', when: 'Yesterday' },
  { id: 'n3', title: 'Parent–teacher conferences open for booking', from: 'Head of School', when: '2 days ago' },
];

export const TEACHER_CLASSES = [
  { id: 'c1', name: 'Biology HL — DP2', students: 18, pendingGrading: 7, avgGrade: 6.2 },
  { id: 'c2', name: 'Biology HL — DP1', students: 22, pendingGrading: 3, avgGrade: 5.8 },
  { id: 'c3', name: 'TOK — DP2', students: 24, pendingGrading: 0, avgGrade: 5.9 },
];

export const SUBMISSIONS_TO_REVIEW = [
  { id: 's1', student: 'Amélie Laurent', assignment: 'Lab Report: Enzyme Kinetics', submittedAt: '3h ago', late: false },
  { id: 's2', student: 'Noah Weiss', assignment: 'Lab Report: Enzyme Kinetics', submittedAt: '5h ago', late: false },
  { id: 's3', student: 'Priya Shah', assignment: 'Lab Report: Enzyme Kinetics', submittedAt: 'Yesterday', late: false },
  { id: 's4', student: 'Kenji Ito', assignment: 'Lab Report: Enzyme Kinetics', submittedAt: '2 days ago', late: true },
];

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