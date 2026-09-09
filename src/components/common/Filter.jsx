/**
 * Reusable filter/search component
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

export default function Filter({
  placeholder = 'Search...',
  onFilterChange,
  value = '',
  onClear = null,
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onFilterChange(e.target.value)}
        className="pl-10 pr-8"
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}