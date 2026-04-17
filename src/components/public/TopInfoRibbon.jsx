import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
    <div className="fixed top-0 left-0 right-0 z-[60] border-b border-[#1B4332]/15 bg-[#1B4332]/95 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white/80 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignIn}
          className="h-7 rounded-full border border-white/20 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/10 hover:text-white sm:text-xs"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}