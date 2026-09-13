import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * The frame every signed-out auth screen sits in — sign in, password reset,
 * accepting an invitation, first login.
 *
 * These four pages had drifted into four slightly different cards. They are
 * the first thing a new teacher sees of the product, so they should at least
 * agree with each other.
 */
export function AuthCard({ title, subtitle, footnote, children }) {
  return (
    <div className="scholr-page min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full" style={{ maxWidth: '23rem' }}>
        <div className="text-center mb-7">
          <Link to="/" className="scholr-focus inline-block" style={{ textDecoration: 'none' }}>
            <img src="/brand/scholr-mark.png" alt="Scholr" width="44" height="44" style={{ borderRadius: '11px' }} />
          </Link>
          <h1 className="scholr-h1 m-0 mt-4 text-2xl">{title}</h1>
          {subtitle && (
            <p className="m-0 mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{subtitle}</p>
          )}
        </div>

        <div className="scholr-panel p-6 auth-fields">{children}</div>

        {footnote && (
          <p className="m-0 mt-6 text-center text-xs" style={{ color: 'var(--faint)' }}>{footnote}</p>
        )}
      </div>

      {/* Inputs are styled here rather than per-page so the four auth screens
          cannot drift apart again. */}
      <style>{`
        .auth-fields input[type='email'],
        .auth-fields input[type='password'],
        .auth-fields input[type='text'] {
          width: 100%;
          margin-top: 0.4rem;
          padding: 0.55rem 0.7rem;
          font-size: 0.92rem;
          font-family: inherit;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: var(--radius-control);
        }
        .auth-fields input:focus-visible {
          outline: 2px solid var(--brand);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

export function AuthField({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="scholr-label">{label}</label>
      {children}
      {hint && <p className="m-0 mt-1 text-xs" style={{ color: 'var(--faint)' }}>{hint}</p>}
    </div>
  );
}

export function AuthError({ children }) {
  return (
    <p
      role="alert"
      className="m-0 px-3 py-2 text-sm"
      style={{
        background: 'var(--crit-sf)',
        color: 'var(--crit)',
        border: '1px solid var(--crit)',
        borderRadius: 'var(--radius-control)',
      }}
    >
      {children}
    </p>
  );
}

export function AuthNote({ children }) {
  return (
    <p
      className="m-0 px-3 py-2 text-sm"
      style={{
        background: 'var(--good-sf)',
        color: 'var(--good)',
        border: '1px solid var(--good)',
        borderRadius: 'var(--radius-control)',
      }}
    >
      {children}
    </p>
  );
}

export function AuthSubmit({ busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="scholr-focus w-full inline-flex items-center justify-center gap-2 text-sm font-medium"
      style={{
        background: 'var(--brand)',
        color: 'var(--brand-ink)',
        border: 'none',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-control)',
        cursor: busy ? 'wait' : 'pointer',
      }}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export default AuthCard;
