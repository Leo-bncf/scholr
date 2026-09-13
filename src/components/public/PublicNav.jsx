import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { isAuthenticated, redirectToLogin } from '@/data/session';

/**
 * The public site's one navigation bar.
 *
 * There used to be two — a pill-shaped floating one on the landing page and a
 * plain one everywhere else — and they listed different links. Between them
 * they pointed at /Pricing, /About and /Careers, none of which are routes, so
 * a visitor clicking Pricing in the header landed on a 404.
 *
 * Every link here resolves to a page that exists. That is a rule, not a
 * coincidence: adding a link means adding the route in the same commit.
 */
const LINKS = [
  { label: 'Features', to: '/Features' },
  { label: 'Pricing', to: '/Pricing' },
  { label: 'Security', to: '/Security' },
  { label: 'Contact', to: '/Contact' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const signIn = async () => {
    if (await isAuthenticated()) {
      window.location.href = '/AppHome';
    } else {
      redirectToLogin('/AppHome');
    }
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'color-mix(in oklab, var(--paper) 86%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-16">
        <Link to="/" className="scholr-focus flex items-center gap-2.5 shrink-0" style={{ textDecoration: 'none' }}>
          <img src="/brand/scholr-mark.png" alt="" width="28" height="28" style={{ borderRadius: '7px' }} />
          <span
            className="text-lg"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)' }}
          >
            Scholr
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 ml-2">
          {LINKS.map(l => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="scholr-focus text-sm px-3 py-1.5"
                style={{
                  textDecoration: 'none',
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={signIn}
            className="scholr-focus text-sm"
            style={{ background: 'none', border: 'none', color: 'var(--body)', cursor: 'pointer' }}
          >
            Sign in
          </button>
          <Link
            to="/BookDemo"
            className="scholr-focus text-sm font-medium"
            style={{
              background: 'var(--brand)',
              color: 'var(--brand-ink)',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-control)',
              textDecoration: 'none',
            }}
          >
            Book a demo
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="scholr-focus md:hidden ml-auto"
          style={{ background: 'none', border: 'none', color: 'var(--body)', cursor: 'pointer', padding: '0.25rem' }}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col" style={{ borderTop: '1px solid var(--rule-soft)' }}>
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="scholr-focus py-2.5 text-sm"
              style={{ textDecoration: 'none', color: 'var(--body)', borderBottom: '1px solid var(--rule-soft)' }}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={signIn}
              className="scholr-focus text-sm"
              style={{ background: 'none', border: 'none', color: 'var(--body)', cursor: 'pointer' }}
            >
              Sign in
            </button>
            <Link
              to="/BookDemo"
              onClick={() => setOpen(false)}
              className="scholr-focus text-sm font-medium ml-auto"
              style={{
                background: 'var(--brand)', color: 'var(--brand-ink)',
                padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-control)', textDecoration: 'none',
              }}
            >
              Book a demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
