import React from 'react';
import { Link } from 'react-router-dom';

// Hallmark · footer: Ft1 Mast-headed · knobs: wordmark=display-2xl,
// tagline=roman body, links=inline
//
// Landing-page-exclusive. src/components/public/PublicFooter.jsx is shared by
// every other public page (Contact, Features, Demo, Security, …) and is left
// untouched — this component only ever renders here.
export default function LandingFooter() {
  return (
    <footer className="border-t border-sl-rule bg-sl-paper font-landingBody">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-landing text-2xl font-semibold text-sl-ink">Scholr</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-sl-neutral">
              A unified LMS for international schools running IB, IGCSE, A&#8209;Level and US curricula.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-sl-ink/80 sm:justify-end">
            <Link to="/Features" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Features</Link>
            <a href="#pricing" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Pricing</a>
            <Link to="/SecurityAndCompliance" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Security</Link>
            <Link to="/Contact" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Contact</Link>
            <Link to="/PrivacyPolicy" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Privacy</Link>
            <Link to="/TermsOfService" className="hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Terms</Link>
          </nav>
        </div>
        <div className="mt-10 flex flex-col-reverse items-start justify-between gap-4 border-t border-sl-rule pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-sl-neutral">&copy; {new Date().getFullYear()} Scholr. All rights reserved.</p>
          <p className="text-xs text-sl-neutral">Built for international schools.</p>
        </div>
      </div>
    </footer>
  );
}
