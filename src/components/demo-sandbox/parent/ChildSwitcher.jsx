import React from 'react';

export default function ChildSwitcher({ children, selectedId, onSelect }) {
  if (children.length <= 1) return null;

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {children.map((child) => {
        const active = selectedId === child.id;
        return (
          <button
            key={child.id}
            onClick={() => onSelect(child)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md border text-sm font-medium transition ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {child.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </span>
            <span>{child.name.split(' ')[0]}</span>
            <span className={active ? 'text-white/70' : 'text-slate-400'}>· {child.grade}</span>
          </button>
        );
      })}
    </div>
  );
}