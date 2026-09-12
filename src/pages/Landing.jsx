/* Hallmark · genre: editorial · macrostructure: Bento Grid
 * F1 Bento knobs: tiles=8, spans=irregular, border=hairline all
 * nav: N6 Newspaper masthead · footer: Ft1 Mast-headed
 * theme: custom (vibe: "collegiate, academic, unhurried" · paper oklch(97% 0.014 70)
 * · accent oklch(33% 0.140 28) warm-red · Fraunces + EB Garamond)
 * Pre-emit self-critique: P5 H4 E4 S4 R5 V5
 */
import React, { useState, useEffect } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import { ExpandableCard } from '@/components/ui/expandable-card';
import LandingFooter from '@/components/landing/LandingFooter';
import ConsentModal from '@/components/public/ConsentModal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '@/data/session';
import { motion, MotionConfig } from 'framer-motion';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import LandingAnimatedBackground from '@/components/landing/LandingAnimatedBackground';
import {
  ArrowRight,
  BookOpen,
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
  Sparkles,
} from 'lucide-react';

const CURRICULA = ['IB', 'IGCSE', 'A-Level', 'US Common Core', 'French Baccalauréat'];

async function goToApp() {
  if (await isAuthenticated()) {
    window.location.href = '/AppHome';
  } else {
    window.location.href = `/Login?next=${encodeURIComponent('/AppHome')}`;
  }
}

function Reveal({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-sl-rule">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="font-landing text-4xl font-semibold leading-[1.1] tracking-tight text-sl-ink sm:text-5xl lg:text-6xl">
              One LMS for every curriculum you teach.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sl-neutral">
              Gradebook, attendance, reporting and the IB core — configured for IB, IGCSE, A&#8209;Level and US Common Core from day one, not bolted on after.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="h-12 rounded-sm bg-sl-accent px-7 text-base font-medium text-sl-accentInk shadow-none hover:bg-sl-ink focus-visible:ring-sl-focus"
                onClick={goToApp}
              >
                Sign in <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link to="/Demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-sm border-sl-rule bg-sl-paper px-7 text-base font-medium text-sl-ink hover:bg-sl-paper2 focus-visible:ring-sl-focus"
                >
                  Book a demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sl-neutral">Built for</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {CURRICULA.map((c) => (
                <li
                  key={c}
                  className="rounded-sm border border-sl-rule bg-sl-paper2 px-3 py-1.5 text-sm text-sl-ink"
                >
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-sl-neutral">
              Every workflow adapts to your curriculum&rsquo;s structure, criteria and terminology — an IB&#8209;only school and a US&#8209;curriculum school see two different apps built on one platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    'Scattered data across spreadsheets, email and disconnected tools.',
    "Weak role-based access — teachers see data they shouldn't.",
    "Parents lack real-time visibility into their child's progress.",
    'Tedious manual workflows for assignments, grading and reporting.',
  ];

  return (
    <section className="border-b border-sl-rule">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-20">
        <Reveal className="lg:col-span-4">
          <h2 className="font-landing text-3xl font-semibold text-sl-ink">
            International schools deserve better tools.
          </h2>
          <p className="mt-4 text-sl-neutral">
            Generic school software wasn&rsquo;t built for the demands of multi&#8209;curricular international schools.
          </p>
        </Reveal>
        <Reveal className="lg:col-span-8">
          <ul className="divide-y divide-sl-rule border-t border-sl-rule">
            {problems.map((p, i) => (
              <li key={i} className="flex items-start gap-4 py-5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sl-accent" aria-hidden="true" />
                <p className="text-base leading-relaxed text-sl-ink">{p}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      title: 'Executive Dashboards',
      short: 'Role-specific insights',
      desc: 'Personalised dashboards for every stakeholder — students see academic progress, teachers manage their classes, coordinators oversee cohorts, parents track their children, and admins control the entire school.',
      icon: PieChart,
      span: 'md:col-span-2',
    },
    {
      title: 'Academic Workflows',
      short: 'Complete assignment lifecycle',
      desc: 'Publish assignments with IB criteria alignment, students submit work through Google Docs, files, or links, teachers give criterion-based feedback, and grades sync automatically.',
      icon: ListChecks,
      span: 'md:col-span-2',
    },
    {
      title: 'Gradebook',
      short: 'Multi-framework grading',
      desc: 'Support for 1–7 IB, A*–E, letter grades and percentages. Predicted grade tracking with historical trends, rubric-based criterion assessment, and term reports aligned to your curriculum.',
      icon: Award,
      span: 'md:col-span-1',
    },
    {
      title: 'Parent Portal',
      short: 'Real-time family engagement',
      desc: 'Parents see grades, attendance, upcoming assignments, teacher feedback and behavioural notes — all updated in real time, with direct messaging to teachers.',
      icon: HeartHandshake,
      span: 'md:col-span-1',
    },
    {
      title: 'Timetable Integration',
      short: 'Schedule synchronisation',
      desc: 'Sync with external timetable systems like Veracross or iSAMS, display daily schedules, manage periods and rooms, and resolve scheduling conflicts automatically.',
      icon: CalendarDays,
      span: 'md:col-span-1',
    },
    {
      title: 'Internal Messaging',
      short: 'Secure communication hub',
      desc: 'Role-aware messaging between teachers, students and parents with granular permissions, class announcements, quiet-hours policies and compliance logging.',
      icon: MessageSquareShare,
      span: 'md:col-span-1',
    },
    {
      title: 'Enterprise Security',
      short: 'Multi-tenant data protection',
      desc: 'Complete multi-tenant isolation so schools cannot access each other’s data, granular role-based access control, audit logging, and GDPR export and deletion tools.',
      icon: ShieldCheck,
      span: 'md:col-span-2',
    },
    {
      title: 'Extended Curriculum',
      short: 'CAS, EE, TOK & more',
      desc: 'Manage CAS experiences with strand mapping and supervisor tracking, track Extended Essay milestones through to final viva voce, and manage TOK deadlines and reflections.',
      icon: Globe2,
      span: 'md:col-span-2',
    },
  ];

  return (
    <section className="border-b border-sl-rule">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="max-w-2xl">
          <h2 className="font-landing text-3xl font-semibold text-sl-ink sm:text-4xl">
            Comprehensive platform capabilities.
          </h2>
          <p className="mt-3 text-sl-neutral">
            Engineered for the rigorous demands of international, multi&#8209;curricular institutions.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {features.map((f, i) => (
            <div key={i} className={f.span}>
              <ExpandableCard
                title={f.title}
                icon={f.icon}
                description={f.short}
                className="h-full"
              >
                <p className="text-lg leading-relaxed text-sl-neutral">{f.desc}</p>
              </ExpandableCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    {
      name: 'Students',
      icon: GraduationCap,
      desc: 'A personalised academic hub that keeps students on top of their workload, performance and extended curriculum commitments.',
      features: [
        'Personal dashboard with grade trends and upcoming deadlines',
        'Submit assignments via Google Docs, file upload, or links',
        'View teacher feedback and criterion scores',
        'Daily timetable with class schedule and room info',
        'Track CAS, EE, and TOK milestones and reflections',
        'Attendance history and absence notifications',
      ],
    },
    {
      name: 'Teachers',
      icon: BookOpen,
      desc: 'Everything a teacher needs to run their classes, assess students, and communicate — in one focused workspace.',
      features: [
        'Class workspace with stream, assignments, and gradebook',
        'Publish assignments with curriculum-aligned criteria',
        'Rubric and criterion-based grading with feedback',
        'One-click attendance recording per class session',
        'Class analytics showing performance trends',
        'Direct messaging with students and parents',
      ],
    },
    {
      name: 'Parents',
      icon: UserCircle,
      desc: "Real-time visibility into your child's academic life: grades, attendance, deadlines, and direct communication with teachers.",
      features: [
        'Live grade and assessment overview per subject',
        'Upcoming assignments and submission status',
        'Attendance records with absence alerts',
        'Behavioural notes visible to parents',
        'Direct, secure messaging with teachers',
        'Term report access and progress summaries',
      ],
    },
    {
      name: 'Coordinators',
      icon: Compass,
      desc: 'Oversight tools for programme coordinators to manage cohorts, predicted grades, extended curriculum, and compliance.',
      features: [
        'Cohort-level grade and performance dashboards',
        'Predicted grade management with trend tracking',
        'IB Core oversight — CAS, EE, and TOK tracking',
        'Compliance reports and exam entry management',
        'Subject registration and level (HL/SL) management',
        'Coordinator approval workflows for student submissions',
      ],
    },
    {
      name: 'Administrators',
      icon: Settings2,
      desc: 'Full school management — users, policies, academic structure, billing, integrations, and security — from one admin panel.',
      features: [
        'User management, invitations, and role assignment',
        'Academic calendar, terms, and cohort configuration',
        'Attendance, behaviour, and gradebook policy controls',
        'Timetable setup and external system integrations',
        'Audit logs, GDPR tools, and access controls',
        'Billing dashboard and subscription management',
      ],
    },
    {
      name: 'Curriculum-aware UI',
      icon: Sparkles,
      desc: 'Tools not designed for your curriculum stay completely hidden. IB-only features like CAS, EE, and TOK never appear in an IGCSE or A-Level school — and vice versa.',
      features: [
        'Curriculum detected at school setup — no manual toggles',
        'IB Core tools hidden for non-IB programmes',
        'Grading scales match your framework automatically',
        'Terminology adapts to your curriculum automatically',
        'Module visibility controlled by school administrators',
        'Zero noise — only relevant tools in every workflow',
      ],
    },
  ];

  const [selected, setSelected] = useState(0);
  const active = roles[selected];

  return (
    <section className="border-b border-sl-rule">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="max-w-2xl">
          <h2 className="font-landing text-3xl font-semibold text-sl-ink sm:text-4xl">
            Purpose-built for every role.
          </h2>
          <p className="mt-3 text-sl-neutral">Every user type has a tailored experience.</p>
        </Reveal>

        <div role="tablist" aria-label="School roles" className="mt-8 flex flex-wrap gap-x-2 gap-y-3 border-b border-sl-rule pb-2">
          {roles.map((r, i) => {
            const isActive = i === selected;
            return (
              <button
                key={r.name}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelected(i)}
                className={`inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus ${
                  isActive ? 'bg-sl-ink text-sl-paper' : 'text-sl-neutral hover:bg-sl-paper2 hover:text-sl-ink'
                }`}
              >
                <r.icon className="h-4 w-4" />
                {r.name}
              </button>
            );
          })}
        </div>

        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 grid gap-8 lg:grid-cols-12"
        >
          <div className="lg:col-span-4">
            <h3 className="font-landing text-2xl font-semibold text-sl-ink">{active.name}</h3>
            <p className="mt-3 leading-relaxed text-sl-neutral">{active.desc}</p>
          </div>
          <ul className="grid gap-x-8 gap-y-3 lg:col-span-8 sm:grid-cols-2">
            {active.features.map((f, j) => (
              <li key={j} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sl-accent" />
                <span className="text-sm leading-relaxed text-sl-ink">{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <h2 className="font-landing text-3xl font-semibold text-sl-ink sm:text-4xl">
            Talk to us before you switch.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-sl-neutral">
            We&rsquo;ll walk your team through gradebook, attendance and IB reporting on your own curriculum — not a generic demo script.
          </p>
          <div className="mt-8">
            <Link to="/Demo">
              <Button
                size="lg"
                className="h-12 rounded-sm bg-sl-accent px-7 text-base font-medium text-sl-accentInk shadow-none hover:bg-sl-ink focus-visible:ring-sl-focus"
              >
                Book a demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const consentGiven = localStorage.getItem('scholr_consent_accepted');
        setShowConsent(consentGiven !== 'true');
      } catch (error) {
        console.error('Error checking consent:', error);
        setShowConsent(true);
      }
    };

    checkConsent();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-sl-paper font-landingBody text-sl-ink">
        <LandingAnimatedBackground />
        <div className="relative z-10">
          <DetachedNavbar />
          <HeroSection />
          <ProblemSection />
          <FeaturesGrid />
          <RolesSection />
          <PricingTiersSection />
          <CTASection />
          <LandingFooter />
        </div>
        <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
      </div>
    </MotionConfig>
  );
}
