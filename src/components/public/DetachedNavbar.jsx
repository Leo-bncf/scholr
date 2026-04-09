import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DetachedNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      navigate(createPageUrl('AppHome'));
    } else {
      base44.auth.redirectToLogin(createPageUrl('AppHome'));
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-sm rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <span className="text-xl font-bold text-blue-950">Scholr</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link to="/" className="text-sm font-medium text-blue-900 hover:text-blue-600 transition-colors">Platform</Link>
        <Link to="/Features" className="text-sm font-medium text-blue-900 hover:text-blue-600 transition-colors">Features</Link>
        <Link to="/Pricing" className="text-sm font-medium text-blue-900 hover:text-blue-600 transition-colors">Pricing</Link>
        <Link to="/Contact" className="text-sm font-medium text-blue-900 hover:text-blue-600 transition-colors">Contact</Link>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSignIn} className="text-sm font-medium text-blue-900 hover:text-blue-600 transition-colors">
          Log in
        </button>
        <Link to="/Demo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            Book Demo
          </Button>
        </Link>
      </div>
    </nav>
  );
}