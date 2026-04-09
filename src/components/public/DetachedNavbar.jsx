import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react'; // Using BookOpen to represent "Scholr"

export default function DetachedNavbar() {
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
    <nav className="w-full max-w-6xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-700 p-2 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Scholr</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link to={createPageUrl('Landing')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">About</Link>
        <Link to={createPageUrl('Features')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Solutions</Link>
        <Link to={createPageUrl('Pricing')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
        <Link to={createPageUrl('Contact')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">FAQ</Link>
        <Link to={createPageUrl('Demo')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Book Demo</Link>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSignIn} 
          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-full px-6 shadow-sm font-medium transition-all"
        >
          Go to Dashboard
        </Button>
      </div>
    </nav>
  );
}