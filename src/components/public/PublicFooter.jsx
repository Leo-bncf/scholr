import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="bg-emerald-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-white">Scholr</span>
            </Link>
            <p className="text-emerald-200 text-sm leading-relaxed">
              The premier LMS designed exclusively for international schools, offering seamless curriculum integration and role-specific dashboards.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/Features" className="text-emerald-300 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link to="/Pricing" className="text-emerald-300 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/Security" className="text-emerald-300 hover:text-white transition-colors text-sm">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/About" className="text-emerald-300 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link to="/Contact" className="text-emerald-300 hover:text-white transition-colors text-sm">Contact</Link></li>
              <li><Link to="/Careers" className="text-emerald-300 hover:text-white transition-colors text-sm">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/PrivacyPolicy" className="text-emerald-300 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/TermsOfService" className="text-emerald-300 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-900 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-emerald-400 text-sm">
            © {new Date().getFullYear()} Scholr Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}