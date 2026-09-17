import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useLightTheme from './useLightTheme';
import SHOTS from '@/marketing/manifest.json';

/**
 * The frame every signed-out auth screen sits in — sign in, password reset,
 * accepting an invitation, first login.
 *
 * These four pages had drifted into four slightly different cards. They are
 * the first thing a new teacher sees of the product, so they should at least
 * agree with each other.
 */
export function AuthCard({ title, subtitle, footnote, children }) {
  useLightTheme();

  return (
    <div className="scholr-page auth-split">
      <div className="auth-form">
        <div className="w-full" style={{ maxWidth: '22rem' }}>
          <Link to="/" className="scholr-focus reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none', '--i': 0 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--brand)', position: 'relative', display: 'block' }}>
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: '1.1rem', letterSpacing: '-.035em', color: 'var(--ink)' }}>
              Scholr
            </span>
          </Link>

          <h1 className="pub-display reveal" style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-2xl)', '--i': 1 }}>
            {title}
          </h1>
          {subtitle && (
            <p className="reveal" style={{ margin: 'var(--space-2xs) 0 0', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-body)', color: 'var(--muted)', '--i': 2 }}>
              {subtitle}
            </p>
          )}

          <div className="auth-fields reveal" style={{ marginTop: 'var(--space-md)', '--i': 3 }}>{children}</div>

          {footnote && (
            <p className="reveal" style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-xs)', color: 'var(--faint)', '--i': 4 }}>
              {footnote}
            </p>
          )}
        </div>
      </div>

      {/* The product, so the first screen a new teacher sees is the thing they
          are signing in to rather than an empty field of paper. Decorative —
          the form is the page — so it is hidden from assistive tech and
          dropped entirely on narrow viewports. */}
      <aside className="auth-aside pub-wash pub-ruled" aria-hidden="true">
        <div className="auth-aside__in">
          <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>Inside</p>
          <p className="pub-display" style={{ margin: 'var(--space-2xs) 0 0', fontSize: 'var(--text-xl)', maxWidth: '18ch' }}>
            Today’s timetable, what’s due, and what’s waiting to be marked.
          </p>
          <img
            src={SHOTS['teacher-dashboard']}
            alt=""
            width="1320"
            height="840"
            loading="lazy"
            decoding="async"
            className="auth-aside__shot"
          />
        </div>
      </aside>

      {/* Inputs and the split are styled here rather than per-page so the four
          auth screens cannot drift apart again. */}
      <style>{`
        .auth-split { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100dvh; }
        .auth-form { display: flex; align-items: center; justify-content: center; padding: var(--space-xl) var(--space-md); }
        .auth-aside { display: none; }
        @media (min-width: 64rem) {
          .auth-split { grid-template-columns: minmax(0, 30rem) minmax(0, 1fr); }
          .auth-form { justify-content: flex-end; padding-right: var(--space-2xl); }
          .auth-aside { display: block; position: relative; overflow: hidden; border-left: 1px solid var(--rule); }
          .auth-aside__in { position: relative; padding: var(--space-2xl) 0 0 var(--space-2xl); height: 100%; }
          .auth-aside__shot {
            display: block; width: 100%; height: clamp(16rem, 42vh, 26rem);
            box-sizing: border-box;
            object-fit: cover; object-position: top center;
            margin-top: var(--space-lg);
            border-radius: var(--radius-large);
            border: 1px solid var(--rule);
            box-shadow: var(--lift-lg);
          }
        }

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
        .auth-fields input {
          transition: border-color var(--dur-short) var(--ease-out);
        }
        .auth-fields input:hover { border-color: var(--muted); }
        .auth-fields input:focus-visible {
          outline: 2px solid var(--brand);
          outline-offset: 1px;
          border-color: var(--brand);
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
