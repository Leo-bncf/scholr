import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function SchoolOverridesTable({ schools, flags, overridesMap, onToggle, onReset }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b scholr-rule">
            <th className="text-left text-xs font-medium scholr-muted uppercase tracking-wide py-3 pr-4">School</th>
            {flags.map((flag) => (
              <th key={flag.key} className="text-center text-xs font-medium scholr-muted uppercase tracking-wide px-2 py-3">
                {flag.shortLabel || flag.label}
              </th>
            ))}
            <th className="text-right text-xs font-medium scholr-muted uppercase tracking-wide py-3 pl-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y scholr-divide">
          {schools.map((school) => {
            const current = overridesMap[school.id] || {};
            return (
              <tr key={school.id}>
                <td className="py-3 pr-4">
                  <p className="text-sm font-medium scholr-ink">{school.name}</p>
                  <p className="text-xs scholr-muted">{school.plan || 'starter'} plan</p>
                </td>
                {flags.map((flag) => (
                  <td key={flag.key} className="px-2 py-3 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={current[flag.key] === undefined ? false : !!current[flag.key]}
                        onCheckedChange={(checked) => onToggle(school, flag.key, checked)}
                      />
                    </div>
                  </td>
                ))}
                <td className="py-3 pl-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => onReset(school.id)} className="text-xs">
                    Reset
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}