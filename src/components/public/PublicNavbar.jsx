import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center w-full">
      <Link to="/" className="text-xl font-bold text-slate-900">Scholr</Link>
      <div className="flex gap-4 items-center">
        <Link to={createPageUrl('Features')} className="text-slate-600 hover:text-slate-900 font-medium">Features</Link>
        <Link to={createPageUrl('Contact')} className="text-slate-600 hover:text-slate-900 font-medium">Contact</Link>
        <Link to={createPageUrl('AppHome')}>
          <Button>Sign In</Button>
        </Link>
      </div>
    </nav>
  );
}