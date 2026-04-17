import React, { useState, useEffect } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import { ExpandableCard } from '@/components/ui/expandable-card';
import PublicFooter from '@/components/public/PublicFooter';
import ConsentModal from '@/components/public/ConsentModal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import TopMarqueeSection from '@/components/landing/TopMarqueeSection';
import LandingAnimatedBackground from '@/components/landing/LandingAnimatedBackground';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Sparkles,
  GraduationCap,
  UserCircle,
  Compass,
  Settings2,
  CheckCircle2,
  ShieldCheck,
  PieChart,
  ListChecks,
  Award,
  HeartHandshake,
  CalendarDays,
  MessageSquareShare,
  Globe2,
} from 'lucide-react';

function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 120, 260], [0, 0.4, 1]);
  const y = useTransform(scrollY, [0, 260], [180, 0]);
  const scale = useTransform(scrollY, [0, 260], [0.96, 1]);
  const wordmarkY = useTransform(scrollY, [0, 220, 520], ["14vh", "-2vh", "-24vh"]);
  const wordmarkOpacity = useTransform(scrollY, [0, 180, 420, 620], [0.92, 1, 0.55, 0]);
  const wordmarkScale = useTransform(scrollY, [0, 220, 520], [1.08, 1, 0.92]);

  const handleSignIn = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      base44.auth.redirectToLogin('/AppHome');
    }
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-40 lg:pb-32 min-h-screen flex items-center">
      <motion.div
        className="pointer-events-none absolute inset-x-0 z-0 overflow-hidden"
        style={{ y: wordmarkY, opacity: wordmarkOpacity, scale: wordmarkScale }}
      >
        <span className="block w-full text-center select-none text-[7rem] sm:text-[11rem] lg:text-[16rem] font-semibold tracking-[0.02em] text-slate-200/70 leading-none whitespace-nowrap scale-x-[1.18] origin-center">
          Scholr
        </span>
      </motion.div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="max-w-4xl mx-auto text-center" style={{ opacity, y, scale }}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
           The LMS designed for
           <span className="text-primary"> the needs of</span>
           {' '}International Schools
          </h1>

          <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A unified platform built for international schools — supporting multiple curricula, grading frameworks, and reporting standards.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button 
               size="lg" 
               className="bg-slate-900 hover:bg-slate-700 text-white rounded-full px-8 h-12 text-base font-medium shadow-sm transition-all"
               onClick={handleSignIn}
             >
               Sign In <ArrowRight className="ml-2 w-4 h-4" />
             </Button>
             <Link to="/Demo">
               <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-medium border-slate-300 hover:bg-slate-50 text-slate-800">
                 Contact Sales for a Free Demo
               </Button>
             </Link>
           </div>
        </motion.div>
        
        <div className="mt-16 mx-auto max-w-3xl">
          <p className="text-lg text-slate-600 leading-relaxed text-center">
            <span className="font-semibold text-slate-900">Multi-curricular</span> — built for schools running IB, IGCSE, A-Levels, US Common Core, and more. <span className="font-semibold text-slate-900">Flexible frameworks</span> — every workflow adapts to your curriculum's structure, criteria, and terminology. <span className="font-semibold text-slate-900">Zero noise</span> — trimmed to exactly what international educators and students need, nothing more.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    { text: 'Scattered data across spreadsheets, email, and disconnected tools' },
    { text: "Weak role-based access — teachers see data they shouldn't" },
    { text: 'Parents lack real-time visibility into their child\'s progress' },
    { text: 'Tedious manual workflows for assignments, grading, and reporting' },
  ];

  return (
    <motion.section
      className="py-20"
      initial={{ opacity: 0, y: 70, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">International schools deserve better tools</h2>
          <p className="mt-3 text-lg text-slate-500">Current platforms weren't built for the unique demands of multi-curricular international schools</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {problems.map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
              <div className="w-1 h-1 rounded-full bg-primary600 mt-2 flex-shrink-0"></div>
              <p className="text-sm text-slate-600 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      title: 'Executive Dashboards',
      short: 'Role-specific insights',
      desc: 'Personalized dashboards for every stakeholder — students see academic progress, teachers manage their classes, coordinators oversee cohorts, parents track their children, and admins control the entire school. Each role receives contextual information tailored to their responsibilities, with quick actions and performance indicators prominently displayed.',
      icon: PieChart,
      color: 'bg-gradient-to-br from-sky-400 to-sky-500 text-white shadow-inner'
    },
    {
      title: 'Academic Workflows',
      short: 'Complete assignment lifecycle',
      desc: 'From creation to grading — publish assignments with IB criteria alignment, students submit work through Google Docs, files, or links, teachers provide criterion-based feedback, and grades sync automatically. Support for multiple submission formats, late submission handling, and comprehensive submission tracking ensure transparency throughout.',
      icon: ListChecks,
      color: 'bg-gradient-to-br from-sky-500 to-primary500 text-white shadow-inner'
    },
    {
      title: 'Gradebook',
      short: 'Multi-framework grading',
      desc: 'Support for multiple grading scales including 1-7 IB, A*-E, letter grades, and percentages. Predicted grade tracking with historical trends, rubric-based criterion assessment, and comprehensive term reports aligned to your curriculum. Generate assessment reports by criterion and lock grades for compliance.',
      icon: Award,
      color: 'bg-gradient-to-br from-primary500 to-primary600 text-white shadow-inner'
    },
    {
      title: 'Parent Portal',
      short: 'Real-time family engagement',
      desc: 'Parents see grades, attendance records, upcoming assignments, teacher feedback, and behavioral notes — all updated in real-time. Direct messaging with teachers keeps communication secure, organised, and compliant with school policies. Parents can also receive progress alerts and attendance warnings.',
      icon: HeartHandshake,
      color: 'bg-gradient-to-br from-primary600 to-indigo-500 text-white shadow-inner'
    },
    {
      title: 'Timetable Integration',
      short: 'Schedule synchronisation',
      desc: 'Sync with external timetable systems like Veracross or iSAMS, display daily class schedules, manage periods and rooms, resolve scheduling conflicts automatically, and track historical schedule changes. Supports multiple concurrent timetables and handles special events and exam schedules.',
      icon: CalendarDays,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-inner'
    },
    {
      title: 'Internal Messaging',
      short: 'Secure communication hub',
      desc: 'Role-aware messaging between teachers, students, and parents with granular permission controls. Create class announcements, manage discussions, implement quiet hours policies, and maintain compliance logging for all communications. Thread-based conversations keep context clear and searchable.',
      icon: MessageSquareShare,
      color: 'bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-inner'
    },
    {
      title: 'Enterprise Security',
      short: 'Data protection',
      desc: 'Complete multi-tenant isolation ensures schools cannot access each other\'s data. Granular role-based access control, audit logging of all critical actions, GDPR compliance tools including data export and deletion, and encrypted data storage at rest and in transit.',
      icon: ShieldCheck,
      color: 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-inner'
    },
    {
      title: 'Extended Curriculum',
      short: 'CAS, EE, TOK & more',
      desc: 'Manage CAS experiences with strand mapping, supervisor tracking, and hourly reflection submissions. Track Extended Essay milestones from initial proposal through final viva voce. Manage TOK deadlines, student reflections, and coordinator approvals in one unified interface.',
      icon: Globe2,
      color: 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-inner'
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Comprehensive Platform Capabilities</h2>
          <p className="mt-3 text-lg text-slate-500">Engineered for the rigorous demands of international multi-curricular institutions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: 'easeOut' }}
            >
            <ExpandableCard
              key={i}
              title={f.title}
              icon={f.icon}
              color={f.color}
              description={f.short}
              classNameExpanded="[&_h4]:text-black dark:[&_h4]:text-white [&_h4]:font-medium"
            >
              <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                {f.desc}
              </p>
            </ExpandableCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FadeInCard({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function RolesSection() {
  const [selectedRole, setSelectedRole] = React.useState(null);

  const roles = [
    {
      name: 'Students',
      short: 'Learn and track progress',
      icon: GraduationCap,
      color: 'sky',
      desc: 'A personalised academic hub that keeps students on top of their workload, performance, and extended curriculum commitments.',
      features: [
        'Personal dashboard with grade trends and upcoming deadlines',
        'Submit assignments via Google Docs, file upload, or links',
        'View teacher feedback and criterion scores',
        'Daily timetable with class schedule and room info',
        'Track CAS, EE, and TOK milestones and reflections',
        'Attendance history and absence notifications',
      ]
    },
    {
      name: 'Teachers',
      short: 'Manage and assess',
      icon: BookOpen,
      color: 'blue',
      desc: 'Everything a teacher needs to run their classes, assess students, and communicate — in one focused workspace.',
      features: [
        'Class workspace with stream, assignments, and gradebook',
        'Publish assignments with curriculum-aligned criteria',
        'Rubric and criterion-based grading with feedback',
        'One-click attendance recording per class session',
        'Class analytics showing performance trends',
        'Direct messaging with students and parents',
      ]
    },
    {
      name: 'Parents',
      short: 'Stay informed and engaged',
      icon: UserCircle,
      color: 'cyan',
      desc: "Real-time visibility into your child's academic life - grades, attendance, deadlines, and direct communication with teachers.",
      features: [
        'Live grade and assessment overview per subject',
        'Upcoming assignments and submission status',
        'Attendance records with absence alerts',
        'Behavioural notes visible to parents',
        'Direct, secure messaging with teachers',
        'Term report access and progress summaries',
      ]
    },
    {
      name: 'Coordinators',
      short: 'Oversee programmes',
      icon: Compass,
      color: 'indigo',
      desc: 'Oversight tools for programme coordinators to manage cohorts, predicted grades, extended curriculum, and compliance.',
      features: [
        'Cohort-level grade and performance dashboards',
        'Predicted grade management with trend tracking',
        'IB Core oversight — CAS, EE, and TOK tracking',
        'Compliance reports and exam entry management',
        'Subject registration and level (HL/SL) management',
        'Coordinator approval workflows for student submissions',
      ]
    },
    {
      name: 'Administrators',
      short: 'Control everything',
      icon: Settings2,
      color: 'violet',
      desc: 'Full school management — users, policies, academic structure, billing, integrations, and security — from one admin panel.',
      features: [
        'User management, invitations, and role assignment',
        'Academic calendar, terms, and cohort configuration',
        'Attendance, behaviour, and gradebook policy controls',
        'Timetable setup and external system integrations',
        'Audit logs, GDPR tools, and access controls',
        'Billing dashboard and subscription management',
      ]
    },
    {
      name: 'Curriculum-Aware UI',
      short: 'No irrelevant clutter',
      icon: Sparkles,
      color: 'teal',
      desc: 'Tools not designed for your curriculum stay completely hidden. IB-only features like CAS, EE, and TOK never appear in an IGCSE or A-Level school — and vice versa.',
      features: [
        'Curriculum detected at school setup — no manual toggles',
        'IB Core tools hidden for non-IB programmes',
        'Grading scales match your framework automatically',
        'Terminology adapts to your curriculum automatically',
        'Module visibility controlled by school administrators',
        'Zero noise — only relevant tools in every workflow',
      ]
    },
  ];

  const colorMap = {
    sky: { bg: 'bg-sky-50', border: 'border-sky-100', icon: 'text-sky-500', activeBorder: 'border-sky-400' },
    blue: { bg: 'bg-primary50', border: 'border-primary100', icon: 'text-primary600', activeBorder: 'border-primary400' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-100', icon: 'text-cyan-600', activeBorder: 'border-cyan-400' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', icon: 'text-indigo-600', activeBorder: 'border-indigo-400' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600', activeBorder: 'border-violet-400' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-100', icon: 'text-teal-600', activeBorder: 'border-teal-400' },
  };

  const selected = selectedRole !== null ? roles[selectedRole] : null;
  const sc = selected ? colorMap[selected.color] : null;

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Purpose-Built Roles</h2>
          <p className="mt-3 text-lg text-slate-500">Every user type has a tailored experience. Click a role to explore its features.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {roles.map((r, i) => {
            const c = colorMap[r.color];
            const isActive = selectedRole === i;
            return (
              <FadeInCard key={i} delay={i * 0.07}>
                <button
                  onClick={() => setSelectedRole(isActive ? null : i)}
                  className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    isActive ? `${c.bg} ${c.activeBorder} shadow-md` : 'bg-white/70 backdrop-blur-sm border-slate-200 hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
                    <r.icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 text-center">{r.name}</p>
                  <p className="text-xs text-slate-500 text-center leading-tight">{r.short}</p>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} />
                </button>
              </FadeInCard>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selected && sc && (
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${sc.activeBorder} shadow-lg p-8`}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl ${sc.bg} ${sc.border} border flex items-center justify-center flex-shrink-0`}>
                  <selected.icon className={`w-6 h-6 ${sc.icon}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{selected.short}</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">{selected.desc}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selected.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 bg-slate-50 rounded-lg p-3">
                    <CheckCircle2 className={`w-4 h-4 ${sc.icon} flex-shrink-0 mt-0.5`} />
                    <span className="text-sm text-slate-600 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CTASection() {
  const benefits = [
    { title: 'Lightning Fast', desc: 'Deploy in days, not months. Get up and running quickly.' },
    { title: 'Enterprise Grade', desc: 'Bank-level security with full GDPR compliance.' },
    { title: 'Dedicated Support', desc: 'Expert team available to help you succeed.' },
    { title: 'Always Improving', desc: 'Regular updates and new features based on school feedback.' },
  ];

  return (
    <motion.section
      className="py-24"
      initial={{ opacity: 0, y: 70, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Why Choose Scholr?</h2>
          <p className="mt-3 text-lg text-slate-500">Built by educators, for educators.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: 'easeOut' }}
              className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <div className="w-3 h-3 rounded-full bg-primary mb-4"></div>
              <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
          initial={{ opacity: 0, y: 70, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to transform your school?</h3>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">See how Scholr can streamline your academic operations. Request a personalized demo or explore our flexible licensing plans.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/Demo">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-8 h-12 text-base font-medium shadow-sm border-none">
                Schedule Demo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const consentGiven = localStorage.getItem('scholr_consent_accepted');
        
        if (consentGiven === 'true') {
          setShowConsent(false);
        } else {
          setShowConsent(true);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
        setShowConsent(true);
      }
    };

    checkConsent();
  }, []);

  return (
    <div className="min-h-screen bg-transparent font-landing">
      <LandingAnimatedBackground />
      <div className="fixed top-10 left-0 right-0 z-50 px-4 flex justify-center">
        <DetachedNavbar />
      </div>
      <div className="relative z-20">
        <div className="relative z-20">
        <TopMarqueeSection />
        <HeroSection />
        <FeaturesGrid />
        <RolesSection />
        <ProblemSection />
        <PricingTiersSection />
        <CTASection />
        <PublicFooter />
        </div>
      </div>
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}