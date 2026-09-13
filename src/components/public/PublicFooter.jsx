import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer.
 *
 * Only links that resolve. The old one advertised About Us and Careers, which
 * were never routes — on a page whose whole job is to look like a company that
 * will still exist in five years, a 404 in the footer is expensive.
 */
const COLUMNS = [
  { title: 'Product', links: [['Features', '/Features'], ['Pricing', '/Pricing'], ['Security', '/Security'], ['Book a demo', '/BookDemo']] },
  { title: 'Company', links: [['Contact', '/Contact']] },
  { title: 'Legal', links: [['Privacy policy', '/PrivacyPolicy'], ['Terms of service', '/TermsOfService']] },
];

export default function PublicFooter() {
  return (
    <footer className="scholr-band" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(13rem, 100%), 1fr))' }}>
          <div className="max-w-xs">
            <Link to="/" className="scholr-focus flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
              <img src="/brand/scholr-mark.png" alt="" width="26" height="26" style={{ borderRadius: '6px' }} />
              <span
                className="text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)' }}
              >
                Scholr
              </span>
            </Link>
            <p className="mt-3 m-0 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              School management for international schools — one platform across IB, IGCSE, A-Level and US curricula.
            </p>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title}>
              <h2 className="scholr-label m-0">{col.title}</h2>
              <ul className="m-0 mt-3 p-0 list-none flex flex-col gap-2">
                {col.links.map(([label, to]) => (
                  <li key={to + label}>
                    <Link
                      to={to}
                      className="scholr-focus text-sm"
                      style={{ color: 'var(--body)', textDecoration: 'none' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p
          className="m-0 mt-12 pt-6 text-xs"
          style={{ borderTop: '1px solid var(--rule)', color: 'var(--muted)' }}
        >
          © {new Date().getFullYear()} Scholr
        </p>
      </div>
    </footer>
  );
}
