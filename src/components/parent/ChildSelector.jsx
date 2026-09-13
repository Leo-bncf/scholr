import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import StatusChip from '@/components/app/StatusChip';
import * as parentStudentLinksData from '@/data/parentStudentLinks';

/**
 * Which child the portal is showing.
 *
 * A segmented row rather than a dropdown: most families have one or two
 * children, and a select box hides the answer to "whose data am I looking at"
 * behind a click. It falls back to wrapping once there are more.
 */
export default function ChildSelector({ parentId, schoolId, selectedChildId, onSelectChild }) {
  const { data: linkedChildren = [], isLoading } = useQuery({
    queryKey: ['parent-children', parentId, schoolId],
    queryFn: async () => {
      const links = await parentStudentLinksData.where({
        school_id: schoolId,
        parent_id: parentId
      });
      return links;
    },
    enabled: !!parentId && !!schoolId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (linkedChildren.length === 0) {
    return (
      <div className="cobalt-panel px-4 py-3.5 flex items-center gap-3 flex-wrap">
        <StatusChip tone="warn">Not linked</StatusChip>
        <p className="m-0 text-sm" style={{ color: 'var(--body)' }}>
          No children are linked to your account — the school office can link them for you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="cobalt-label">Viewing</span>
      {linkedChildren.map(link => {
        const selected = link.student_id === selectedChildId;
        return (
          <button
            key={link.student_id}
            type="button"
            onClick={() => onSelectChild(link.student_id)}
            aria-pressed={selected}
            className="cobalt-focus text-sm"
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-control)',
              border: `1px solid ${selected ? 'var(--cobalt)' : 'var(--rule)'}`,
              background: selected ? 'var(--cobalt)' : 'var(--surface)',
              color: selected ? 'var(--cobalt-ink)' : 'var(--body)',
              cursor: 'pointer',
            }}
          >
            {link.student_name}
            <span className="ml-1.5 text-xs" style={{ opacity: 0.75 }}>{link.relationship}</span>
          </button>
        );
      })}
    </div>
  );
}
