import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import StatusChip from '@/components/app/StatusChip';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as membershipsData from '@/data/memberships';

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

  /* parent_student_links carries a denormalised student_name, and nothing
     guarantees it was filled — the seeded link has it blank. The old code
     printed it anyway and then appended link.relationship, so a parent with
     one child saw a button labelled "guardian": the relationship type, not a
     person. Resolve the real name from the membership and treat the
     denormalised copy as a hint. */
  const { data: studentMemberships = [] } = useQuery({
    queryKey: ['parent-children-names', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, role: 'student' }),
    enabled: !!schoolId,
  });

  const nameFor = (link) => {
    const m = studentMemberships.find((x) => x.user_id === link.student_id);
    return link.student_name?.trim() || m?.user_name?.trim() || m?.user_email || 'Unnamed student';
  };

  /* One child is the common case, and making that parent click a single
     button before the portal shows anything is a dead first screen. */
  const onlyChildId = linkedChildren.length === 1 ? linkedChildren[0].student_id : null;
  useEffect(() => {
    if (onlyChildId && !selectedChildId) onSelectChild(onlyChildId);
  }, [onlyChildId, selectedChildId, onSelectChild]);

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
      <div className="scholr-panel px-4 py-3.5 flex items-center gap-3 flex-wrap">
        <StatusChip tone="warn">Not linked</StatusChip>
        <p className="m-0 text-sm" style={{ color: 'var(--body)' }}>
          No children are linked to your account — the school office can link them for you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="scholr-label">Viewing</span>
      {linkedChildren.map(link => {
        const selected = link.student_id === selectedChildId;
        return (
          <button
            key={link.student_id}
            type="button"
            onClick={() => onSelectChild(link.student_id)}
            aria-pressed={selected}
            className="scholr-focus text-sm"
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-control)',
              border: `1px solid ${selected ? 'var(--brand)' : 'var(--rule)'}`,
              background: selected ? 'var(--brand)' : 'var(--surface)',
              color: selected ? 'var(--brand-ink)' : 'var(--body)',
              cursor: 'pointer',
            }}
          >
            {nameFor(link)}
            {link.relationship && linkedChildren.length > 1 && (
              <span className="ml-1.5 text-xs" style={{ opacity: 0.75 }}>{link.relationship}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
