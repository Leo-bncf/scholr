import React from 'react';
import { Segmented } from '@/components/app/AppShell';

/**
 * The header for a school-admin page that has tabs.
 *
 * This used to be its own world: a sticky white bar with a shadow, a
 * `text-base font-black` title, and a `colorScheme` prop offering seven hues —
 * indigo, blue, emerald, amber, purple, rose, cyan — so every admin section
 * picked a different colour for its tabs. Nothing was encoded by the choice.
 * That is decoration wearing the costume of information, and it is why these
 * pages read as a different product from the dashboard next door.
 *
 * Now it uses the same shape as AppShell: an eyebrow in small caps, the page
 * title at display size on the paper ground, and the shared segmented control
 * for the tabs. One accent, because there is one brand.
 */
export default function AdminTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  title,
  subtitle,
  rightContent,
}) {
  return (
    <div className="app-measure" style={{ paddingTop: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
        <div style={{ minWidth: 0 }}>
          {subtitle && <p className="scholr-label" style={{ margin: 0 }}>{subtitle}</p>}
          {title && <h1 className="app-title" style={{ margin: '.15rem 0 0' }}>{title}</h1>}
        </div>
        {rightContent && <div style={{ marginLeft: 'auto', flex: 'none' }}>{rightContent}</div>}
      </div>

      {tabs?.length > 0 && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Segmented
            label={title ? `${title} sections` : 'Sections'}
            value={activeTab}
            onChange={onTabChange}
            options={tabs.map((t) => ({
              value: t.id,
              // The badge rides in the label rather than as a coloured pill:
              // a count is not a status and does not earn the reserved palette.
              label: t.badge ? `${t.label} ${t.badge}` : t.label,
            }))}
          />
        </div>
      )}
    </div>
  );
}
