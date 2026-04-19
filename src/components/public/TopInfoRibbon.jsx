import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function TopInfoRibbon() {
  const handleSignIn = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      base44.auth.redirectToLogin('/AppHome');
    }
  };

  const links = [
    { label: 'Privacy', to: '/PrivacyPolicy' },
    { label: 'Terms', to: '/TermsOfService' },
    { label: 'Security', to: '/SecurityAndCompliance' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] transition hover:text-white/80"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] transition hover:text-white/80 sm:text-xs"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}