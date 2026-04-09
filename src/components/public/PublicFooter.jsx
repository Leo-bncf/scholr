import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-100 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-white mb-4">Scholr</h3>
            <p className="text-sm text-slate-400">The LMS designed for IB World Schools.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to={createPageUrl('Features')} className="hover:text-slate-100 transition">Features</Link></li>
              <li><Link to={createPageUrl('SecurityAndCompliance')} className="hover:text-slate-100 transition">Security</Link></li>
              <li><Link to={createPageUrl('Demo')} className="hover:text-slate-100 transition">Demo</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to={createPageUrl('Contact')} className="hover:text-slate-100 transition">Contact</Link></li>
              <li><a href="mailto:support@scholr.pro" className="hover:text-slate-100 transition">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to={createPageUrl('PrivacyPolicy')} className="hover:text-slate-100 transition">Privacy Policy</Link></li>
              <li><Link to={createPageUrl('TermsOfService')} className="hover:text-slate-100 transition">Terms of Service</Link></li>
              <li><Link to={createPageUrl('SecurityAndCompliance')} className="hover:text-slate-100 transition">Security & Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-sm text-slate-400 text-center">
          <p>&copy; 2026 Scholr. All rights reserved. Designed for IB World Schools.</p>
        </div>
      </div>
    </footer>
  );
}