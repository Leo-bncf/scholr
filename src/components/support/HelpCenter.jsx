import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, GraduationCap, Users, BarChart2, Shield, ExternalLink, Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ARTICLES = [
  {
    category: 'Getting Started',
    icon: BookOpen,
    articles: [
      {
        title: 'Setting up your school for the first time',
        content: 'Start by running the Setup Wizard from Dashboard → Getting Started. You\'ll be guided through creating an Academic Year, defining Terms, adding Subjects, creating Classes, and inviting your first staff members. Each step can be saved individually — you don\'t need to complete everything in one session.',
        tags: ['wizard', 'setup', 'onboarding'],
      },
      {
        title: 'Understanding academic years, terms, and cohorts',
        content: 'An Academic Year is the top-level container (e.g. 2025-2026). Terms are reporting periods within it (e.g. Term 1, Semester 1). Cohorts group students for IB DP1/DP2 tracking. Classes are the actual teaching groups and belong to an Academic Year. All reporting and grade locks are scoped by Term.',
        tags: ['academic year', 'terms', 'cohorts'],
      },
      {
        title: 'Inviting teachers and configuring roles',
        content: 'Go to Users → Invite User. Choose role: Teacher (class access), IB Coordinator (school-wide grade/CAS oversight), School Admin (full admin access), Student, or Parent. Invited users receive an email and create their own password. You can deactivate accounts without deleting data by setting status to Inactive.',
        tags: ['users', 'roles', 'invite'],
      },
    ],
  },
  {
    category: 'IB Workflows',
    icon: GraduationCap,
    articles: [
      {
        title: 'How predicted grades work',
        content: 'Predicted grades are entered by teachers per subject and per student. Coordinators can view all predictions school-wide from Coordinator Dashboard → Predicted Grades. Once the coordinator locks predicted grades (Gradebook Governance → Predicted Grades), teachers can no longer edit them. You can release predictions to students and parents separately.',
        tags: ['predicted grades', 'ib', 'coordinator'],
      },
      {
        title: 'CAS, EE, and TOK tracking',
        content: 'Students log CAS experiences from their Student Dashboard. Teachers/coordinators can view and comment from the Coordinator IB Core page. Extended Essay milestones are tracked with supervisor assignments and due dates. TOK tasks work similarly. All IB Core data is scoped to the school and academic year.',
        tags: ['cas', 'ee', 'tok', 'ib core'],
      },
      {
        title: 'Setting up reporting windows and grade locks',
        content: 'Go to Gradebook Governance → Grade Locks. Create a reporting window with an opens_at and locks_at date. When a window locks, teachers cannot edit grades in that period. Admins can override locks with a justification if"Admin can override lock" is enabled. Locked periods appear in coordinator reports.',
        tags: ['grade locks', 'reporting', 'windows'],
      },
      {
        title: 'Rubric grading and IB criteria',
        content: 'Create rubric templates from Gradebook Governance → Rubric Library. Each template has criteria (e.g. Criterion A, B, C) with strand descriptors. Teachers assign rubric templates to grade items. Students receive criterion-by-criterion feedback. Protected templates (marked is_protected) cannot be modified by teachers.',
        tags: ['rubrics', 'criteria', 'grading'],
      },
    ],
  },
  {
    category: 'Managing Users & Classes',
    icon: Users,
    articles: [
      {
        title: 'Enrolling students in classes',
        content: 'From Classes → select a class → Students tab. Use the enrolment interface to search and add students. If your school uses timetable sync (e.g. Untis, iSAMS), rosters may be locked and managed automatically. Check Settings → Timetable for sync status. Bulk enrolment via CSV is available from the Enrolments page.',
        tags: ['enrolment', 'students', 'classes'],
      },
      {
        title: 'Co-teachers and permission levels',
        content: 'A class has one primary teacher and can have co-teachers. Co-teachers can be granted grades permission (can grade), feedback permission (can comment only), or manage permission (can edit class settings). Set these from Classes → select class → Teachers tab → Co-teacher settings.',
        tags: ['co-teacher', 'permissions', 'classes'],
      },
      {
        title: 'Parent-student links and portal access',
        content: 'Link parents to students from Users → parent record → Linked Students. Once linked, parents can view grades, attendance, and behaviour records that are marked visible_to_parent. The parent portal is read-only — parents cannot submit or edit anything. You can revoke links at any time.',
        tags: ['parents', 'portal', 'links'],
      },
    ],
  },
  {
    category: 'Reports & Data Exports',
    icon: BarChart2,
    articles: [
      {
        title: 'Generating student progress reports',
        content: 'Go to Reports → PDF Report Builder. Select a term, choose individual students or the whole cohort, and click Generate. Reports include grades, predicted grades, attendance summary, and behaviour notes flagged as visible. You can customise the report header and school logo in School Settings.',
        tags: ['reports', 'pdf', 'progress'],
      },
      {
        title: 'Exporting data to CSV',
        content: 'Reports → CSV Export Toolkit offers 9 export types: student list, class roster, grade summary, attendance log, behaviour records, CAS hours, EE milestones, predicted grades, and audit log. All exports are scoped to your school. Exports are logged in the audit trail.',
        tags: ['csv', 'export', 'data'],
      },
    ],
  },
  {
    category: 'Governance & Compliance',
    icon: Shield,
    articles: [
      {
        title: 'Audit log and change tracking',
        content: 'Every sensitive action (grade edit after lock, role change, data export, behaviour deletion) is logged in Governance → Audit Log. You can filter by user, action type, and date range. Audit logs are retained for the period set in Governance → Data Retention. Logs cannot be edited or deleted by school admins.',
        tags: ['audit', 'compliance', 'governance'],
      },
      {
        title: 'GDPR and privacy requests',
        content: 'If a student, parent, or teacher submits a data request (access, deletion, correction), log it in Governance → Privacy Requests. Set a due date (GDPR deadline is 30 days). Track status through pending → in progress → completed. Identity verification can be required before processing deletions.',
        tags: ['gdpr', 'privacy', 'data requests'],
      },
      {
        title: 'Change reason enforcement',
        content: 'Governance → Change Reason Enforcement lets you require admins to provide a written reason for sensitive actions like grade-after-lock edits, role changes, or behaviour record deletions. Reasons are stored in the audit log. This is recommended for IB schools to satisfy internal audit requirements.',
        tags: ['reason', 'change', 'enforcement'],
      },
    ],
  },
];


function ArticleItem({ article }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b scholr-rule-soft last:border-0">
      <button
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:scholr-sunk rounded transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-medium scholr-ink">{article.title}</span>
        {open ? <ChevronDown className="w-4 h-4 scholr-faint shrink-0" /> : <ChevronRight className="w-4 h-4 scholr-faint shrink-0" />}
      </button>
      {open && (
        <div className="pb-4 px-1">
          <p className="text-sm scholr-muted leading-relaxed">{article.content}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {article.tags.map(t => (
              <span key={t} className="text-xs scholr-sunk scholr-muted px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState(new Set(['Getting Started']));

  const toggleCat = (cat) => setOpenCats(prev => {
    const next = new Set(prev);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    return next;
  });

  const filtered = query.trim()
    ? ARTICLES.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.content.toLowerCase().includes(query.toLowerCase()) ||
          a.tags.some(t => t.includes(query.toLowerCase()))
        ),
      })).filter(cat => cat.articles.length > 0)
    : ARTICLES;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 scholr-faint" />
        <Input
          className="pl-9"
          placeholder="Search help articles… (e.g. predicted grades, enrolment, audit)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Quick links */}
      {!query && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Run Setup Wizard', href: '/SchoolAdminOnboarding', icon: CheckCircle2, color: 'indigo' },
            { label: 'Grading rules', href: '/SchoolAdminRules?tab=grading', icon: BarChart2 },
            { label: 'Records and privacy', href: '/SchoolAdminRules?tab=records', icon: Shield },
          ].map(link => {
            const Icon = link.icon;
            return (
              <a key={link.label} href={link.href} className="flex items-center gap-3 p-3 app-group hover:scholr-accent-rule hover:shadow-sm transition-colors group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center scholr-sunk scholr-muted`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold scholr-body group-hover:scholr-accent">{link.label}</span>
                <ExternalLink className="w-3 h-3 scholr-faint ml-auto group-hover:scholr-accent" />
              </a>
            );
          })}
        </div>
      )}

      {/* Articles */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 scholr-faint">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No articles match your search.</p>
          </div>
        )}
        {filtered.map(cat => {
          const Icon = cat.icon;
          const isOpen = query ? true : openCats.has(cat.category);
          return (
            <div key={cat.category} className="app-group overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 hover:scholr-sunk transition-colors"
                onClick={() => !query && toggleCat(cat.category)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 scholr-sunk scholr-muted`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold scholr-ink flex-1 text-left">{cat.category}</span>
                <span className="text-xs scholr-faint mr-2">{cat.articles.length} articles</span>
                {!query && (isOpen ? <ChevronDown className="w-4 h-4 scholr-faint" /> : <ChevronRight className="w-4 h-4 scholr-faint" />)}
              </button>
              {isOpen && (
                <div className="px-5 pb-2">
                  {cat.articles.map((a, i) => <ArticleItem key={i} article={a} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}