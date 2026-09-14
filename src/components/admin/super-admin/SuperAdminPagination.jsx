import React from 'react';

/**
 * Pager for a list inside a Group.
 *
 * It sits as the last child of the group, so the group's own `> * + *` rule
 * draws the hairline above it — it must not draw its own, or the line
 * doubles. Previously it painted `bg-slate-50/70` and a slate border, which
 * is why every paged list ended in a grey slab.
 */
export default function SuperAdminPagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems <= pageSize) return null;

  const btn = {
    font: 'inherit', fontSize: '.78rem', padding: '.28rem .7rem',
    borderRadius: 'var(--radius-control)', border: '1px solid var(--rule)',
    background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer',
  };
  const disabled = { ...btn, opacity: .4, cursor: 'not-allowed' };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem .9rem' }}>
      <p className="scholr-num" style={{ margin: 0, fontSize: '.78rem', color: 'var(--muted)' }}>
        {first}–{last} of {totalItems}
      </p>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
        <button
          type="button"
          className="scholr-focus"
          style={page <= 1 ? disabled : btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="scholr-focus"
          style={page >= totalPages ? disabled : btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
