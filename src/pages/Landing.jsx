import React, { useState, useEffect } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import CTASection from '@/components/landing/CTASection';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import ProblemSection from '@/components/landing/ProblemSection';
import RolesSection from '@/components/landing/RolesSection';
import { ExpandableCard } from '@/components/ui/expandable-card';
import PublicFooter from '@/components/public/PublicFooter';
import AnimatedBackground from '@/components/public/AnimatedBackground';
import ConsentModal from '@/components/public/ConsentModal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import TopMarqueeSection from '@/components/landing/TopMarqueeSection';
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

  const handleSignIn = async () => {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      window.location.href = '/AppHome';
    } else {
      base44.auth.redirectToLogin('/AppHome');
    }
  };

  return (
    <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-32 overflow-hidden">
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
        </div>
        
        <div className="mt-16 mx-auto max-w-3xl">
          <p className="text-lg text-slate-600 leading-relaxed text-center">
            <span className="font-semibold text-slate-900">Multi-curricular</span> — built for schools running IB, IGCSE, A-Levels, US Common Core, and more. <span className="font-semibold text-slate-900">Flexible frameworks</span> — every workflow adapts to your curriculum's structure, criteria, and terminology. <span className="font-semibold text-slate-900">Zero noise</span> — trimmed to exactly what international educators and students need, nothing more.
          </p>
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

// PricingTiersSection replaced the legacy PricingSection

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
    <div className="relative min-h-screen bg-transparent font-landing">
      <AnimatedBackground />
      <div className="fixed top-16 left-0 right-0 z-50 px-4 flex justify-center">
        <DetachedNavbar />
      </div>
      <div className="relative z-10">
        <TopMarqueeSection />
        <HeroSection />
        <FeaturesGrid />
        <RolesSection />
        <ProblemSection />
        <PricingTiersSection />
        <CTASection />
        <PublicFooter />
      </div>
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}