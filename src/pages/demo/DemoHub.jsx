import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, UserCircle, Settings2, ArrowRight, Sparkles } from 'lucide-react';
import DemoRoleSwitcher from '@/components/demo-sandbox/DemoRoleSwitcher';
import { SCHOOL } from '@/components/demo-sandbox/mockSchoolData';

const ROLES = [
  {
    path: '/demo/student',
    name: 'Student',
    icon: GraduationCap,
    color: 'from-sky-500 to-blue-600',
    desc: 'View grades, submit assignments, check timetable, track CAS & EE progress.',
  },
  {
    path: '/demo/teacher',
    name: 'Teacher',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    desc: 'Manage classes, grade submissions, record attendance, message students.',
  },
  {
    path: '/demo/parent',
    name: 'Parent',
    icon: UserCircle,
    color: 'from-amber-500 to-orange-600',
    desc: "Monitor your child's grades, attendance, and communicate with teachers.",
  },
  {
    path: '/demo/leader',
    name: 'School Leader',
    icon: Settings2,
    color: 'from-violet-500 to-purple-600',
    desc: 'Oversee school-wide metrics, manage staff, configure policies, view reports.',
  },
];

export default function DemoHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Live sandbox · No sign-up required
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Try Scholr as any role
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Explore a pre-seeded school — <span className="font-semibold text-slate-800">{SCHOOL.name}</span> — from the perspective of every user type. Nothing you do is saved.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map((role) => (
            <Link
              key={role.path}
              to={role.path}
              className="group relative rounded-2xl bg-white border border-slate-200 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${role.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} text-white shadow-lg`}>
                <role.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{role.name}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{role.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:gap-3 transition-all">
                Enter demo <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4">
            ← Back to marketing site
          </Link>
        </div>
      </div>

      <DemoRoleSwitcher />
    </div>
  );
}