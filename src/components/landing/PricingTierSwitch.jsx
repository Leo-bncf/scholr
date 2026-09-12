import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PricingTierSwitch({ options, value, onChange, className }) {
  return (
    <div className={cn('grid grid-cols-3 rounded-sm border border-sl-rule bg-sl-paper p-1 font-landingBody', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-sm px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus',
              active ? 'text-sl-accentInk' : 'text-sl-neutral hover:text-sl-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId="pricing-tier-switch"
                className="absolute inset-0 rounded-sm bg-sl-accent"
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