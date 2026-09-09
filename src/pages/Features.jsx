import React from 'react';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, BookOpen, Users, Shield, ClipboardCheck, Star, ArrowRight, CheckCircle
} from 'lucide-react';

function FeatureBlock({ icon: Icon, title, description, bullets, reversed }) {
  return (
    <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center py-16`}>
      <div className="flex-1">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed mb-6">{description}</p>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 w-full">
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl border border-slate-200 p-8 aspect-[4/3] flex items-center justify-center">
          <Icon className="w-20 h-20 text-slate-300" />
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  const features = [
    {
      icon: BarChart3,
      title: 'Role-Specific Dashboards',
      description: 'Every user gets a personalized dashboard designed for their daily workflow. No clutter, no irrelevant data.',
      bullets: [
        'Students see today\'s timetable, pending assignments, and recent grades',
        'Teachers see classes to teach, submissions to grade, and attendance tracking',
        'Parents get a clear view of each child\'s progress and upcoming deadlines',
        'Coordinators monitor cohorts, predicted grades, and reporting cycles',
        'Admins oversee the entire school operations from a single view',
      ],
    },
    {
      icon: ClipboardCheck,
      title: 'Modern Assignment Workflows',
      description: 'From creation to grading, assignments flow seamlessly between teachers and students.',
      bullets: [
        'Create assignments with IB criteria, attachments, and due dates',
        'Students submit work via file upload or link',
        'Track submission status: on time, late, missing',
        'Inline grading with feedback and rubric-based scoring',
        'Late submission policies configurable per school',
      ],
    },
    {
      icon: BookOpen,
      title: 'IB-Native Gradebook',
      description: 'Built around the IB 1-7 scale, with support for criteria-based assessment and predicted grades.',
      bullets: [
        'Grade items with IB 1-7 scale and percentage tracking',
        'Visibility controls: choose what students and parents can see',
        'Term-based grade organization',
        'Predicted grades workflow for IB coordinator review',
        'Missing, late, and excused status tracking',
      ],
    },
    {
      icon: Users,
      title: 'Parent Portal',
      description: 'Give parents the visibility they need without overwhelming them with internal data.',
      bullets: [
        'View grades, assignments, and attendance for linked children',
        'Multi-child support with easy switching',
        'Only see parent-visible data as configured by the school',
        'Direct messaging with teachers when permitted',
        'Behavior notes and progress reports',
      ],
    },
    {
      icon: Shield,
      title: 'Multi-School Data Isolation',
      description: 'Each school\'s data is strictly isolated. No cross-school data leaks, ever.',
      bullets: [
        'Every record is scoped to a specific school',
        'Role-based access control enforced at every level',
        'Teachers only see their assigned classes',
        'Students only see their own data',
        'Full audit logging of all sensitive actions',
      ],
    },
    {
      icon: Star,
      title: 'IB Core: CAS, EE & TOK',
      description: 'Track the three pillars of the IB Diploma Programme in dedicated modules.',
      bullets: [
        'CAS activity logging with reflection entries',
        'Extended Essay milestone tracking',
        'TOK task management and submission',
        'Coordinator overview across the cohort',
        'Student self-tracking with supervisor feedback',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-16 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Built for IB, not bolted on
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Every feature is designed around IB workflows, roles, and assessment standards. No generic school software here.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 divide-y divide-slate-100">
        {features.map((f, i) => (
          <FeatureBlock key={i} {...f} reversed={i % 2 === 1} />
        ))}
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to see it in action?</h2>
          <p className="text-slate-500 mb-8">Book a personalized demo and discover how Scholr can transform your school.</p>
          <Link to={createPageUrl('Demo')}>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-12">
              Book a Demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}