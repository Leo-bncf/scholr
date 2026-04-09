import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-500">&copy; {new Date().getFullYear()} Scholr. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to={createPageUrl('PrivacyPolicy')} className="text-sm text-slate-500 hover:text-slate-900">Privacy Policy</Link>
          <Link to={createPageUrl('TermsOfService')} className="text-sm text-slate-500 hover:text-slate-900">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}