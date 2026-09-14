import React from 'react';
import { Group } from '@/components/app/AppShell';

/**
 * A section of the platform settings.
 *
 * This is now just a Group with its description as the first row, so settings
 * sections look like every other grouped list in the product. It used to draw
 * its own white card with a slate border and a slate divider, which is why
 * this page stayed grey while the rest moved to the tokens.
 */
export default function ConfigSectionCard({ title, description, children }) {
  return (
    <Group title={title}>
      {description ? (
        <p style={{ margin: 0, padding: '.7rem .9rem 0', fontSize: '.8rem', color: 'var(--muted)' }}>
          {description}
        </p>
      ) : null}
      <div style={{ padding: 'var(--space-md) .9rem' }}>{children}</div>
    </Group>
  );
}
