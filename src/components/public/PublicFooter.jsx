import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Ft5 · Statement.
 *
 * One display sentence closes the page; the wordmark, a short link row and the
 * copyright sit beneath in muted small type.
 *
 * What this replaces: four columns of links headed Product / Company / Legal,
 * with a copyright tail. That shape (Ft3) is one of the named AI fingerprints —
 * genre-blind, identical on a bakery and a B2B platform, and a catalogue of a
 * sitemap the site doesn't have. Scholr has eight public pages; it does not
 * need a directory, it needs a closing line.
 */
const LINKS = [
  ['Platform', '/Features'],
  ['Pricing', '/Pricing'],
  ['Security', '/Security'],
  ['Contact', '/Contact'],
  ['Privacy', '/PrivacyPolicy'],
  ['Terms', '/TermsOfService'],
];

export default function PublicFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)', background: 'var(--surface)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '4rem 1.5rem 2.5rem' }}>
        <p
          className="pub-display"
          style={{ margin: 0, fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', maxWidth: '18ch' }}
        >
          Built in Ireland for schools that teach more than one thing.
        </p>

        <div
          style={{
            display: 'flex', gap: '1.6rem', flexWrap: 'wrap', alignItems: 'baseline',
            marginTop: '3rem', paddingTop: '1.2rem', borderTop: '1px solid var(--rule-soft)',
          }}
        >
          <Link to="/" className="scholr-focus" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none', flex: 'none' }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--brand)', position: 'relative', display: 'block' }}>
              <span style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 620, fontSize: '.95rem', letterSpacing: '-.03em', color: 'var(--ink)' }}>Scholr</span>
          </Link>

          {LINKS.map(([label, to]) => (
            <Link key={to} to={to} className="scholr-focus" style={{ fontSize: '.85rem', color: 'var(--muted)', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}

          <span className="scholr-label" style={{ marginLeft: 'auto', color: 'var(--faint)' }}>
            © {new Date().getFullYear()} Scholr
          </span>
        </div>
      </div>
    </footer>
  );
}
