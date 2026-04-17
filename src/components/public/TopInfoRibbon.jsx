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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[#1B4332] transition hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B4332] transition hover:opacity-70 sm:text-xs"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}