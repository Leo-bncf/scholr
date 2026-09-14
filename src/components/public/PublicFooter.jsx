import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/Features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/Security', label: 'Security' },
  { to: '/SecurityAndCompliance', label: 'Compliance' },
  { to: '/demo', label: 'Demo' },
  { to: '/Contact', label: 'Contact' },
  { to: '/PrivacyPolicy', label: 'Privacy policy' },
  { to: '/TermsOfService', label: 'Terms of service' },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[var(--mkt-paper)] border-t border-[var(--mkt-rule)] py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img src="/brand/scholr-mark.png" alt="Scholr" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-lg font-semibold text-[var(--mkt-ink)] tracking-tight">Scholr</span>
        </Link>
        <p className="mt-3 text-sm text-[var(--mkt-ink-3)] max-w-sm">
          School management for international schools running IB, IGCSE, A&#8209;Level and US programmes side by side.
        </p>

        <nav aria-label="Footer" className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) =>
            l.to.startsWith('/#') ? (
              <a key={l.label} href={l.to} className="text-sm text-[var(--mkt-ink-2)] hover:text-[var(--mkt-ink)] transition-colors whitespace-nowrap">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.to} className="text-sm text-[var(--mkt-ink-2)] hover:text-[var(--mkt-ink)] transition-colors whitespace-nowrap">
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="mt-10 pt-6 border-t border-[var(--mkt-rule)]">
          <p className="text-sm text-[var(--mkt-ink-3)]">© {new Date().getFullYear()} Scholr. Built in Ireland.</p>
        </div>
      </div>
    </footer>
  );
}