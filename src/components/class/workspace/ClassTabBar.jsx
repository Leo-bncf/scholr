import React from 'react';

/**
 * Grouped tab bar for class workspaces.
 *
 * `groups` is an array of:
 *   { label: 'Teach', tabs: [{ id, label, icon, badge? }, ...] }
 *
 * Groups are visually separated but share a single horizontal scroll row.
 */
export default function ClassTabBar({ groups, activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-stretch gap-1 -mb-px">
          {groups.map((group, gi) => (
            <React.Fragment key={group.label}>
              {gi > 0 && <div key={`sep-${gi}`} className="w-px bg-slate-200 my-2 mx-1 flex-shrink-0" />}
              {group.tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-3 md:px-3.5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {tab.label}
                    {tab.badge != null && tab.badge > 0 && (
                      <span className={`ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}