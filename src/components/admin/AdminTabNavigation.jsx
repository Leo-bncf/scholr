import React from 'react';

export default function AdminTabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  colorScheme = 'indigo',
  title,
  subtitle,
  rightContent
}) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-600' },
  };

  const colors = colorMap[colorScheme] || colorMap.indigo;

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && <h1 className="text-base font-black text-slate-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {rightContent}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? `${colors.bg} ${colors.text}`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.badge && (
                  <span className={`ml-1 ${colors.badge} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}