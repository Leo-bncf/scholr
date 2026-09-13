import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { isAuthenticated, redirectToLogin } from '@/data/session';

/**
 * The public site's one navigation bar.
 *
 * There used to be two — a floating pill on the landing page and a plain bar
 * everywhere else — listing different links, and between them they pointed at
 * /Pricing, /About and /Careers, none of which were routes.
 *
 * Every link here resolves to a page that exists. That is a rule, not a
 * coincidence: adding a link means adding the route in the same commit.
 */
const LINKS = [
  { label: 'Platform', to: '/Features' },
  { label: 'Pricing', to: '/Pricing' },
  { label: 'Security', to: '/Security' },
  { label: 'Contact', to: '/Contact' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const { pathname } = useLocation();

  // The bar sits flush at the top of the page and only lifts into a floating
  // pill once you have scrolled past the hero's first line. A pill that is
  // already floating at scroll position zero has nothing to float above.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signIn = async () => {
    if (await isAuthenticated()) window.location.href = '/AppHome';
    else redirectToLogin('/AppHome');
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Gate 14: never animate padding — it's a layout property and every
          frame costs a reflow. The bar keeps a fixed box and the inner pill
          slides up into it on `transform`. */}
      <div style={{ padding: 'var(--space-2xs) var(--space-sm)' }}>
        <nav
          className={stuck ? 'pub-nav' : ''}
          style={{
            maxWidth: '72rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1.4rem',
            padding: stuck ? undefined : 'var(--space-2xs) var(--space-2xs) var(--space-2xs) var(--space-3xs)',
            transform: stuck ? 'translateY(0)' : 'translateY(2px)',
            transition:
              'background var(--dur-slow) var(--ease-out), box-shadow var(--dur-slow) var(--ease-out), '
              + 'border-color var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
            border: stuck ? undefined : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          <Link to="/" className="scholr-focus" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none', flex: 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--brand)', position: 'relative', display: 'block' }}>
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.035em', color: 'var(--ink)' }}>
              Scholr
            </span>
          </Link>

          <div className="hidden md:flex" style={{ gap: '1.3rem' }}>
            {LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="scholr-focus"
                style={{
                  fontSize: '.89rem',
                  textDecoration: 'none',
                  color: pathname === l.to ? 'var(--ink)' : 'var(--body)',
                  borderBottom: pathname === l.to ? '1.5px solid var(--brand)' : '1.5px solid transparent',
                  paddingBottom: 1,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex" style={{ marginLeft: 'auto', alignItems: 'center', gap: '.9rem' }}>
            <button type="button" onClick={signIn} className="scholr-focus" style={{ background: 'none', border: 'none', font: 'inherit', fontSize: '.89rem', color: 'var(--body)', cursor: 'pointer' }}>
              Sign in
            </button>
            <Link to="/BookDemo" className="pub-btn pub-btn-gold scholr-focus">Book a demo</Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="md:hidden scholr-focus"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '.25rem' }}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {open && (
        <div className="md:hidden" style={{ margin: '0 1rem', padding: '0.5rem 1rem 1rem', background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-surface)', boxShadow: 'var(--lift-md)' }}>
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="scholr-focus" style={{ display: 'block', padding: '.6rem 0', fontSize: '.95rem', color: 'var(--body)', textDecoration: 'none', borderBottom: '1px solid var(--rule-soft)' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', paddingTop: '.9rem' }}>
            <button type="button" onClick={signIn} className="scholr-focus" style={{ background: 'none', border: 'none', font: 'inherit', fontSize: '.9rem', color: 'var(--body)', cursor: 'pointer' }}>Sign in</button>
            <Link to="/BookDemo" onClick={() => setOpen(false)} className="pub-btn pub-btn-gold scholr-focus" style={{ marginLeft: 'auto' }}>Book a demo</Link>
          </div>
        </div>
      )}
    </div>
  );
}
