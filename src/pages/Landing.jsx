import React, { useState, useEffect } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import { ExpandableCard } from '@/components/ui/expandable-card';
import PublicFooter from '@/components/public/PublicFooter';
import AnimatedBackground from '@/components/public/AnimatedBackground';
import ConsentModal from '@/components/public/ConsentModal';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Users, BarChart3, Shield, 
  MessageSquare, Calendar, ClipboardCheck, Star,
  ChevronRight, Sparkles, GraduationCap, UserCheck,
  UserCircle, Compass, Settings2, CheckCircle2,
  LayoutDashboard, LibraryBig, FilePenLine, UsersRound, 
  CalendarClock, MessageCircleMore, ShieldCheck, Trophy,
  PieChart, ListChecks, Award, HeartHandshake, CalendarDays,
  MessageSquareShare, Globe2
} from 'lucide-react';

function HeroSection() {
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
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
           The LMS designed for
           <span className="text-blue-600"> the needs of</span>
           {' '}International Schools
          </h1>
          <p className="mt-6 text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            A unified platform built for international schools — supporting multiple curricula, grading frameworks, and reporting standards.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button size="lg" className="bg-slate-900 hover:bg-slate-700 text-white rounded-full px-8 h-12 text-base font-medium shadow-sm transition-all" onClick={handleSignIn}>
               Sign In <ArrowRight className="ml-2 w-4 h-4" />
             </Button>
             <Link to={createPageUrl('Demo')}>
               <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-medium border-slate-300 hover:bg-slate-50 text-slate-800">
                 Contact Sales for a Free Demo
               </Button>
             </Link>
           </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { title: 'Executive Dashboards', short: 'Role-specific insights', desc: 'Customizable dashboards that give every stakeholder exactly the data they need, when they need it.', icon: PieChart, color: 'bg-zinc-100 text-sky-500' },
    { title: 'Academic Workflows', short: 'Complete assignment lifecycle', desc: 'From planning to submission and grading, streamline the entire academic workflow in one place.', icon: ListChecks, color: 'bg-zinc-100 text-blue-500' },
    { title: 'Gradebook', short: 'Multi-framework grading', desc: 'Support for IB, IGCSE, and standard grading scales, allowing mixed curriculum tracking.', icon: Award, color: 'bg-zinc-100 text-indigo-500' },
    { title: 'Parent Portal', short: 'Real-time family engagement', desc: 'Keep parents informed with real-time updates on attendance, behavior, and academic progress.', icon: HeartHandshake, color: 'bg-zinc-100 text-cyan-600' },
    { title: 'Timetable Integration', short: 'Schedule synchronisation', desc: 'Seamlessly sync with your school\'s timetabling software to keep everyone in the right place.', icon: CalendarDays, color: 'bg-zinc-100 text-blue-600' },
    { title: 'Internal Messaging', short: 'Secure communication hub', desc: 'Safe, monitored communication channels between staff, students, and parents.', icon: MessageSquareShare, color: 'bg-zinc-100 text-sky-600' },
    { title: 'Enterprise Security', short: 'Data protection', desc: 'Bank-grade security and GDPR compliance to keep your school\'s sensitive data protected.', icon: ShieldCheck, color: 'bg-zinc-100 text-indigo-600' },
    { title: 'Extended Curriculum', short: 'CAS, EE, TOK & more', desc: 'Dedicated modules for core curriculum components, built specifically for IB schools.', icon: Globe2, color: 'bg-zinc-100 text-blue-400' },
  ];
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Everything your school needs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <ExpandableCard key={i} title={f.title} icon={f.icon} color={f.color} description={f.short} classNameExpanded="[&_h4]:text-black dark:[&_h4]:text-white [&_h4]:font-medium">
              <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{f.desc}</p>
            </ExpandableCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function FadeInCard({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

function RolesSection() {
  const [selectedRole, setSelectedRole] = useState(0);
  const roles = [
    { name: 'Students', short: 'Learn and track progress', icon: GraduationCap, color: 'text-sky-500' },
    { name: 'Teachers', short: 'Manage and assess', icon: BookOpen, color: 'text-blue-500' },
    { name: 'Parents', short: 'Stay informed and engaged', icon: UserCircle, color: 'text-cyan-600' },
    { name: 'Coordinators', short: 'Oversee programmes', icon: Compass, color: 'text-indigo-500' },
    { name: 'Administrators', short: 'Control everything', icon: Settings2, color: 'text-blue-600' },
    { name: 'Curriculum-Aware UI', short: 'No irrelevant clutter', icon: Sparkles, color: 'text-sky-600' },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Tailored for every role</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {roles.map((r, i) => {
            const isActive = selectedRole === i;
            return (
              <FadeInCard key={i} delay={i * 0.07}>
                <button onClick={() => setSelectedRole(i)} className={`w-full flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${isActive ? `bg-white border-blue-600 shadow-md ring-1 ring-blue-600` : 'bg-white border-slate-200 hover:shadow-sm hover:border-slate-300'}`}>
                  <div className={`w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center`}><r.icon className={`w-6 h-6 ${r.color}`} /></div>
                  <p className="text-sm font-semibold text-slate-900 text-center">{r.name}</p>
                </button>
              </FadeInCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your school?</h2>
        <Link to={createPageUrl('Demo')}>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 rounded-full px-8 h-12 text-lg font-semibold">
            Schedule a Demo
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(true);
  
  useEffect(() => {
    try {
      if (localStorage.getItem('scholr_consent_accepted') === 'true') {
        setShowConsent(false);
      }
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <AnimatedBackground />
      <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center">
        <DetachedNavbar />
      </div>
      <div className="relative z-10 pt-20">
        <HeroSection />
        <FeaturesGrid />
        <RolesSection />
        <CTASection />
        <PublicFooter />
      </div>
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}