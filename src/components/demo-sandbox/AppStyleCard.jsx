import React from 'react';

/**
 * Card that mirrors the main Scholr app's styling:
 * white surface, slate-50 header strip with uppercase tracked title.
 */
export default function AppStyleCard({ title, icon: Icon, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-md border border-slate-200 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              {Icon && <Icon className="w-4 md:w-5 h-4 md:h-5 text-indigo-600 flex-shrink-0" />}
              <span>{title}</span>
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}