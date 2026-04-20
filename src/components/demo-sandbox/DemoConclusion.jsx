import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BookOpen, Users } from 'lucide-react';

const CREDIBILITY = [
  { icon: BookOpen,    label: 'Built for IB workflows' },
  { icon: ShieldCheck, label: 'GDPR compliant' },
  { icon: Users,       label: 'Designed for real classroom use' },
];

/**
 * Final call-to-action shown at the bottom of every demo role dashboard.
 * Tone: confident, simple, not salesy — mirrors the main marketing surfaces.
 */
export default function DemoConclusion() {
  return (
    <section className="mt-10 md:mt-14 rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 md:px-10 py-8 md:py-10">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            End of demo
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            See Scholr in your school.
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
            You've seen the product as a student, teacher, parent and school leader.
            The next step is a conversation with your team — on your timetable, your
            curriculum, and your data.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/Contact"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition"
            >
              Book a demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/Contact"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Request pilot access
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 md:px-10 py-4">
        <ul className="flex flex-col sm:flex-row sm:items-center sm:gap-8 gap-3">
          {CREDIBILITY.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
              <Icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}