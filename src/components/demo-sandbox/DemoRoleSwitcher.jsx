import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, BookOpen, UserCircle, Settings2, LayoutGrid, X } from 'lucide-react';

const ROLES = [
  { path: '/demo', label: 'Hub', icon: LayoutGrid },
  { path: '/demo/student', label: 'Student', icon: GraduationCap },
  { path: '/demo/teacher', label: 'Teacher', icon: BookOpen },
  { path: '/demo/parent', label: 'Parent', icon: UserCircle },
  { path: '/demo/leader', label: 'Leader', icon: Settings2 },
];

export default function DemoRoleSwitcher() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-slate-900 text-white shadow-2xl h-12 w-12 flex items-center justify-center hover:bg-slate-800 transition"
        aria-label="Open demo switcher"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white shadow-2xl p-2 flex items-center gap-1 border border-slate-700">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-r border-slate-700 mr-1">
        Demo
      </div>
      {ROLES.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              active ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={() => setOpen(false)}
        className="ml-1 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
        aria-label="Collapse switcher"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}