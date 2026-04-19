import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DetachedNavbar() {
  const handleLogin = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      base44.auth.redirectToLogin('/AppHome');
    }
  };

  return (
    <nav className="w-full max-w-6xl rounded-full border-0 bg-white/25 backdrop-blur-xl shadow-[0_10px_40px_rgba(30,81,75,0.12)] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-sm">
            S
          </div>
          <span className="text-2xl font-semibold text-slate-900 tracking-tight">Scholr</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-primary">
          <Link to="/" className="hover:text-primary/80 transition-colors">Platform</Link>
          <Link to="/Features" className="hover:text-primary/80 transition-colors">Features</Link>
          <Link to="/Pricing" className="hover:text-primary/80 transition-colors">Pricing</Link>
          <Link to="/Contact" className="hover:text-primary/80 transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogin}
            className="hidden sm:inline-flex text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Log in
          </button>
          <Link to="/Demo">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 h-10 text-sm font-semibold shadow-sm">
              Book Demo
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}