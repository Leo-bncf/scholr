import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PricingTierSwitch({ options, value, onChange, className }) {
  return (
    <div className={cn('grid grid-cols-3 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full px-4 py-3 text-sm font-semibold transition-colors',
              active ? 'text-white' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {active && (
              <motion.span
                layoutId="pricing-tier-switch"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}