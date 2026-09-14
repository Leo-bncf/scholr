import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function FeatureFlagToggleGroup({ title, items, values, onChange }) {
  return (
    <div>
      {title ? <h3 className="text-sm font-semibold scholr-ink mb-3">{title}</h3> : null}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-sm font-medium scholr-ink">{item.label}</Label>
              {item.description ? <p className="text-xs scholr-muted mt-1">{item.description}</p> : null}
            </div>
            <Switch
              checked={!!values[item.key]}
              onCheckedChange={(checked) => onChange(item.key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}