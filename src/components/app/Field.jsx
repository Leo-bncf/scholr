import React from 'react';
import { Search } from 'lucide-react';

/**
 * The form controls for the signed-in app.
 *
 * These exist so a search box looks the same on Schools, Users, Billing and
 * Audit log. Each of those pages had written its own, and each had drifted:
 * three different paddings and an indigo focus ring left over from base44,
 * on a product whose accent is green.
 */

/** A labelled control. The label is always rendered — never a bare placeholder. */
export function Field({ label, hint, htmlFor, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', minWidth: 0 }}>
      {label && (
        <label className="scholr-label" htmlFor={htmlFor} style={{ margin: 0 }}>
          {label}
        </label>
      )}
      {children}
      {hint && <span style={{ fontSize: '.75rem', color: 'var(--faint)' }}>{hint}</span>}
    </div>
  );
}

/** A search box. The magnifier is decorative; the input carries the label. */
export function SearchField({ value, onChange, placeholder = 'Search', label = 'Search', id }) {
  return (
    <span className="app-search">
      <Search aria-hidden="true" />
      <input
        id={id}
        type="search"
        className="app-input scholr-focus"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

/** A native select — keyboard and screen-reader behaviour for free. */
export function SelectField({ value, onChange, options, label, id }) {
  return (
    <select
      id={id}
      className="app-input scholr-focus"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** A row of filters above a list. Wraps rather than overflowing on narrow screens. */
export function FilterBar({ children }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'flex-end', marginBottom: 'var(--space-md)' }}>
      {children}
    </div>
  );
}
