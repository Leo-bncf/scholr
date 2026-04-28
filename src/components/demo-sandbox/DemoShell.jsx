import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import DemoRoleSwitcher from './DemoRoleSwitcher';
import DemoTour from './tour/DemoTour';
import { SCHOOL } from './mockSchoolData';
import { DEMO_ROLES } from './demoRolesConfig';

export default function DemoShell({ roleKey, children }) {
  const role = DEMO_ROLES[roleKey];
  const tourRef = useRef(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/demo" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Exit demo
            </Link>
            <div className="hidden md:block h-6 w-px bg-slate-200" />
            <div className="hidden md:block text-sm truncate">
              <span className="font-semibold text-slate-900">{SCHOOL.name}</span>
              <span className="text-slate-400 mx-2">·</span>
              <span className="text-slate-500">{SCHOOL.academicYear} · {SCHOOL.termName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role?.tour?.length > 0 && (
              <button
                onClick={() => tourRef.current?.replay()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                title="Replay the guided tour"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Replay tour</span>
              </button>
            )}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500">{role.name}</span>
              <span className="text-sm font-semibold text-slate-900">{role.userName}</span>
            </div>
            <div className={`h-9 w-9 rounded-full ${role.accent} text-white flex items-center justify-center text-sm font-bold`}>
              {role.userInitials}
            </div>
          </div>
        </div>
      </header>

      <motion.main
        key={roleKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>

      {role?.tour?.length > 0 && (
        <DemoTour ref={tourRef} roleKey={roleKey} steps={role.tour} />
      )}

      <DemoRoleSwitcher />
    </div>
  );
}