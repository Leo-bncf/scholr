import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GraduationCap, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function AppSidebar({ links, role, schoolName, userName, userId, schoolId }) {
  const location = useLocation();

  const roleLabels = {
    super_admin: 'Platform Admin',
    school_admin: 'School Admin',
    ib_coordinator: 'IB Coordinator',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  };

  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 bg-white text-slate-900 flex flex-col z-40 md:flex border-r border-slate-200">
      <div className="p-3 md:p-5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <Link to={createPageUrl('Landing')} className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0 hover:opacity-90 transition-opacity cursor-pointer">
            <img
              src="https://media.base44.com/images/public/69a0347d243a60c91ce938c9/3799d407a_image.png"
              alt="Scholr"
              className="w-7 md:w-8 h-7 md:h-8 rounded-md shadow-sm object-cover flex-shrink-0"
            />
            <span style={{ fontFamily: "'Merriweather', serif" }} className="text-xl font-semibold truncate tracking-tight text-slate-900">Scholr</span>
          </Link>
          {userId && schoolId && (
            <div className="hidden md:block">
              <NotificationBell userId={userId} schoolId={schoolId} />
            </div>
          )}
        </div>
        {schoolName && (
          <p className="text-xs text-slate-500 mt-2 truncate">{schoolName}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 md:p-3 space-y-0.5">
        {links.map((link) => {
          const isActive = location.pathname.includes(link.page.replace(/\s/g, ''));
          return (
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              className={`flex items-center gap-2 md:gap-3 px-2.5 md:px-3.5 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <link.icon className="w-4 md:w-4.5 h-4 md:h-4.5 shrink-0" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          <div className="w-7 md:w-8 h-7 md:h-8 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-200 text-slate-700">
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-xs md:text-sm font-medium truncate text-slate-900">{userName || 'User'}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{roleLabels[role] || role}</p>
          </div>
        </div>
        <button 
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-1.5 md:gap-2 w-full px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}