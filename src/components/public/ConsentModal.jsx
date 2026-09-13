import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Cookie notice.
 *
 * Two things were wrong with the old one.
 *
 * It asked consent to "analyze platform usage" — but there is no analytics in
 * this codebase at all: no PostHog, no Sentry, no Google tag, nothing. It was
 * asking permission for something that does not happen, which is both
 * inaccurate and a conversion cost on the first screen a prospect sees.
 *
 * And "Decline" recorded nothing, so a visitor who declined was asked again on
 * every single visit. Both answers are now stored; declining is a real answer,
 * not a dismissal.
 *
 * If tracking is ever added, this has to go back to being a genuine consent
 * gate that blocks the tracker until a choice is made — a stored "accepted"
 * flag is not the same thing as consent collected before the fact.
 */
const KEY = 'scholr_consent_accepted';

export default function ConsentModal({ isOpen, onClose }) {
  const record = (accepted) => {
    try {
      localStorage.setItem(KEY, accepted ? 'true' : 'false');
    } catch {
      // A locked-down browser can refuse storage. Nothing to persist, so the
      // notice reappears next visit — annoying, but not broken.
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="scholr-panel fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-50 p-5"
      style={{ maxWidth: '23rem', boxShadow: '0 10px 30px oklch(20% 0.02 170 / 0.14)' }}
    >
      <h2 className="scholr-label m-0">Cookies</h2>
      <p className="m-0 mt-2 text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
        Scholr uses strictly necessary cookies to keep you signed in. There is no analytics or
        advertising tracking on this site.{' '}
        <Link to="/PrivacyPolicy" className="scholr-focus" style={{ color: 'var(--brand)' }}>
          Privacy policy
        </Link>
        .
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => record(false)}
          className="scholr-focus text-sm"
          style={{
            background: 'var(--surface)',
            color: 'var(--body)',
            border: '1px solid var(--rule)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-control)',
            cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => record(true)}
          className="scholr-focus text-sm font-medium"
          style={{
            background: 'var(--brand)',
            color: 'var(--brand-ink)',
            border: 'none',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-control)',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
