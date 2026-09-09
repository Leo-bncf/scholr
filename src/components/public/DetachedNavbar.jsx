import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated, redirectToLogin } from '@/data/session';

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
    <nav className="w-full max-w-6xl rounded-full border border-white/40 bg-white/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,40,35,0.18)] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/brand/scholr-mark.png"
            alt="Scholr"
            className="h-9 w-9 rounded-xl shadow-sm object-cover"
          />
          <span className="text-2xl font-semibold text-slate-900 tracking-tight">Scholr</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-900">
          <Link to="/" className="hover:text-primary transition-colors">Platform</Link>
          <Link to="/Features" className="hover:text-primary transition-colors">Features</Link>
          <Link to="/Pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link to="/Contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogin}
            className="hidden sm:inline-flex text-sm font-bold text-slate-900 hover:text-primary transition-colors"
          >
            Log in
          </button>
          <Link to="/Demo">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 h-10 text-sm font-semibold shadow-md">
              Book Demo
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}