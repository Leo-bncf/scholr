import { GraduationCap, BookOpen, UserCircle, Settings2 } from 'lucide-react';

// Single source of truth for demo roles — used by the hub, shell, onboarding, and switcher.
export const DEMO_ROLES = {
  student: {
    key: 'student',
    path: '/demo/student',
    name: 'Student',
    userName: 'Amélie Laurent',
    userInitials: 'AL',
    icon: GraduationCap,
    gradient: 'from-sky-500 to-blue-600',
    accent: 'bg-sky-500',
    accentText: 'text-sky-600',
    accentRing: 'ring-sky-500/30',
    tagline: 'The learner experience',
    desc: 'View grades, submit assignments, check timetable, track CAS & EE progress.',
    contextLine: 'Signed in as Amélie Laurent · DP2 · Term 2 loaded',
    onboarding: [
      {
        title: 'Your academic home',
        body: 'See upcoming assignments, current and predicted grades, and today\'s timetable — all in one focused view tailored to DP2.',
      },
      {
        title: 'Submit without friction',
        body: 'Assignments accept Google Docs, uploads, or links. Submissions auto-sync to your teacher\'s gradebook.',
      },
      {
        title: 'Stay ahead',
        body: 'Track attendance, see criterion-level feedback, and never miss an announcement from your coordinator.',
      },
    ],
    tour: [
      { selector: '[data-tour="student-next-up"]',   title: "What's next?",            body: "Your most urgent deadline is always pinned here — click to jump straight in." },
      { selector: '[data-tour="student-deadlines"]', title: 'Upcoming deadlines',      body: 'Every assignment from every class, sorted by urgency. Red means due tomorrow.' },
      { selector: '[data-tour="student-progress"]',  title: 'Live subject progress',   body: 'Real-time completion per subject and your predicted IB grade — updated as teachers mark work.' },
      { selector: '[data-tour="student-feedback"]',  title: 'Feedback is centralized', body: 'All teacher comments live here — no more digging through emails or chat apps.' },
    ],
  },
  teacher: {
    key: 'teacher',
    path: '/demo/teacher',
    name: 'Teacher',
    userName: 'Dr. Sarah Chen',
    userInitials: 'SC',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-600',
    accentRing: 'ring-emerald-500/30',
    tagline: 'The educator workspace',
    desc: 'Manage classes, grade submissions, record attendance, message students.',
    contextLine: 'Signed in as Dr. Sarah Chen · 3 classes · 7 submissions to grade',
    onboarding: [
      {
        title: 'Your classes, at a glance',
        body: 'Every class shows pending grading, attendance gaps, and performance trends. Jump straight to what needs attention.',
      },
      {
        title: 'Criterion-based grading',
        body: 'Grade against IB criteria or your own rubrics. Feedback syncs to students and parents instantly.',
      },
      {
        title: 'One-click attendance',
        body: 'Record attendance per period in seconds. Patterns surface automatically for pastoral follow-up.',
      },
    ],
    tour: [
      { selector: '[data-tour="teacher-queue"]',    title: 'Click here to review submissions', body: 'Everything waiting for your grade — sorted with late work surfaced first.' },
      { selector: '[data-tour="teacher-classes"]',  title: 'Your classes at a glance',         body: 'Each card shows students, pending grading, and class average. Tap to dive deeper.' },
      { selector: '[data-tour="teacher-schedule"]', title: "Today's schedule",                 body: 'Your periods for today — synced from the school timetable.' },
    ],
  },
  parent: {
    key: 'parent',
    path: '/demo/parent',
    name: 'Parent',
    userName: 'Elena Laurent',
    userInitials: 'EL',
    icon: UserCircle,
    gradient: 'from-amber-500 to-orange-600',
    accent: 'bg-amber-500',
    accentText: 'text-amber-600',
    accentRing: 'ring-amber-500/30',
    tagline: 'The family portal',
    desc: "Monitor your child's grades, attendance, and communicate with teachers.",
    contextLine: 'Signed in as Elena Laurent · 2 children linked · messaging enabled',
    onboarding: [
      {
        title: 'All your children in one view',
        body: 'Switch between children with a single click. Each view is fully scoped to that child\'s school, year, and teachers.',
      },
      {
        title: 'Real-time academic visibility',
        body: 'Grades, predicted grades, attendance, behaviour notes, and upcoming deadlines — updated as teachers enter them.',
      },
      {
        title: 'Secure, compliant messaging',
        body: 'Message teachers directly. All conversations respect the school\'s communication policies and quiet hours.',
      },
    ],
    tour: [
      { selector: '[data-tour="parent-switcher"]', title: 'All your children, one view', body: 'Switch between children in a click. Everything below updates instantly.' },
      { selector: '[data-tour="parent-deadlines"]', title: 'This shows real-time progress', body: "Upcoming work with a plain-English status — you'll never wonder what's going on again." },
      { selector: '[data-tour="parent-feedback"]', title: 'Feedback, not email chains',    body: "Teacher notes arrive here directly — no more chasing emails or fragmented updates." },
    ],
  },
  leader: {
    key: 'leader',
    path: '/demo/leader',
    name: 'School Admin',
    userName: 'Dr. James Okonkwo',
    userInitials: 'JO',
    icon: Settings2,
    gradient: 'from-violet-500 to-purple-600',
    accent: 'bg-violet-500',
    accentText: 'text-violet-600',
    accentRing: 'ring-violet-500/30',
    tagline: 'The leadership console',
    desc: 'Oversee school-wide metrics, manage staff, configure policies, view reports.',
    contextLine: 'Signed in as Dr. James Okonkwo · Head of School · full access',
    onboarding: [
      {
        title: 'The whole school, one screen',
        body: 'Enrollment, attendance, grade distribution, and operational health — live across every programme and year.',
      },
      {
        title: 'Policies, not spreadsheets',
        body: 'Configure grading rules, attendance policies, messaging governance, and access controls from one console.',
      },
      {
        title: 'Reports that actually ship',
        body: 'Generate term reports, export data, and audit every critical action with full GDPR-ready logs.',
      },
    ],
    tour: [
      { selector: '[data-tour="leader-hero"]',    title: 'Where are problems emerging?', body: 'A live count of declining subjects and flagged students across your chosen filter.' },
      { selector: '[data-tour="leader-filters"]', title: 'Slice by year or subject',     body: 'Filter by year group and subject — every panel below reacts instantly.' },
      { selector: '[data-tour="leader-subjects"]',title: 'Performance overview',         body: 'Subjects sorted lowest-first so the weakest area is always top of the list.' },
      { selector: '[data-tour="leader-atrisk"]',  title: 'Early warning system',         body: 'Students flagged for grade drops, missing work, attendance or behaviour — with severity indicators.' },
    ],
  },
};

export const DEMO_ROLE_ORDER = ['student', 'teacher', 'parent', 'leader'];