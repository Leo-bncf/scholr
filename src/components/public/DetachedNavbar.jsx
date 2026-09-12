import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated, redirectToLogin } from '@/data/session';

// Hallmark · nav: N6 Newspaper masthead · knobs: issue-line=above wordmark,
// wordmark=2xl, rule=double
export default function DetachedNavbar() {
  const handleLogin = async () => {
    const isAuthed = await isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      redirectToLogin('/AppHome');
    }
  };

  return (
    <header className="w-full bg-sl-paper font-landingBody">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <p className="text-center text-[0.65rem] font-medium uppercase tracking-[0.22em] text-sl-neutral">
          For IB · IGCSE · A&#8209;Level &amp; multi&#8209;curricular schools
        </p>
        <Link
          to="/"
          className="mt-1 block text-center font-landing text-3xl font-semibold tracking-tight text-sl-ink transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus sm:text-4xl"
        >
          Scholr
        </Link>

        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-y border-sl-rule py-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            <Link to="/Features" className="text-sl-ink/80 transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Features</Link>
            <a href="#pricing" className="text-sl-ink/80 transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Pricing</a>
            <Link to="/SecurityAndCompliance" className="text-sl-ink/80 transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Security</Link>
            <Link to="/Contact" className="text-sl-ink/80 transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus">Contact</Link>
          </div>
          <div className="flex items-center gap-5 sm:ml-4">
            <button
              type="button"
              onClick={handleLogin}
              className="font-medium text-sl-ink/80 transition-colors hover:text-sl-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus"
            >
              Log in
            </button>
            <Link to="/Demo">
              <Button className="h-9 rounded-sm bg-sl-accent px-4 text-sm font-medium text-sl-accentInk shadow-none hover:bg-sl-ink focus-visible:ring-sl-focus">
                Book a demo
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
