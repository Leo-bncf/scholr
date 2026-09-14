import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated, redirectToLogin } from '@/data/session';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/Features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/Contact', label: 'Contact' },
];

export default function DetachedNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async () => {
    const isAuthed = await isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      redirectToLogin('/AppHome');
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="relative w-full max-w-3xl">
      <nav
        aria-label="Primary"
        className="rounded-full border border-[var(--mkt-rule)] bg-[var(--mkt-paper)]/80 backdrop-blur-md shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.18)] px-3 sm:px-4 py-2"
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/brand/scholr-mark.png"
              alt="Scholr"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-semibold text-[var(--mkt-ink)] tracking-tight whitespace-nowrap">Scholr</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--mkt-ink-2)]">
            {LINKS.map((l) => (
              <a key={l.label} href={l.to} className="hover:text-[var(--mkt-ink)] transition-colors whitespace-nowrap">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogin}
              className="hidden md:inline-flex text-sm font-medium text-[var(--mkt-ink-2)] hover:text-[var(--mkt-ink)] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)] rounded-md px-1"
            >
              Sign in
            </button>
            <Link to="/BookDemo">
              <Button className="rounded-full bg-[var(--mkt-ink)] hover:bg-[var(--mkt-ink)]/90 text-[var(--mkt-paper)] px-4 h-9 text-sm font-medium shadow-none whitespace-nowrap">
                Book a demo
              </Button>
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-full text-[var(--mkt-ink)] hover:bg-[var(--mkt-paper-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)]"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden absolute inset-x-0 top-[calc(100%+0.5rem)] rounded-2xl border border-[var(--mkt-rule)] bg-[var(--mkt-paper)] shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.22)] p-4 flex flex-col gap-1"
        >
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-[15px] font-medium text-[var(--mkt-ink)] hover:bg-[var(--mkt-paper-2)] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogin();
            }}
            className="text-left px-3 py-2.5 rounded-lg text-[15px] font-medium text-[var(--mkt-ink)] hover:bg-[var(--mkt-paper-2)] transition-colors"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}
