import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import DemoRoleSwitcher from './DemoRoleSwitcher';
import { SCHOOL } from './mockSchoolData';

export default function DemoShell({ roleLabel, userName, userInitials, accent = 'bg-primary', children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/demo" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Exit demo
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900">{SCHOOL.name}</span>
              <span className="text-slate-400 mx-2">·</span>
              <span className="text-slate-500">{SCHOOL.academicYear} · {SCHOOL.termName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500">{roleLabel}</span>
              <span className="text-sm font-semibold text-slate-900">{userName}</span>
            </div>
            <div className={`h-9 w-9 rounded-full ${accent} text-white flex items-center justify-center text-sm font-bold`}>
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <DemoRoleSwitcher />
    </div>
  );
}