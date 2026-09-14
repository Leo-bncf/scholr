import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PricingTierSwitch({ options, value, onChange, className }) {
  return (
    <div className={cn('grid grid-cols-3 rounded-full border border-[var(--coral-rule)] bg-[var(--coral-paper)] p-1', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap',
              active ? 'text-[var(--coral-paper)]' : 'text-[var(--coral-ink-3)] hover:text-[var(--coral-ink)]'
            )}
          >
            {active && (
              <motion.span
                layoutId="pricing-tier-switch"
                className="absolute inset-0 rounded-full bg-[var(--coral-ink)]"
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