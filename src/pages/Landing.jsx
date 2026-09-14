/* Hallmark · genre: modern-minimal · macrostructure: Workbench · theme: custom (leaf green)
 * nav: N5 Floating pill · footer: Ft1 Mast-headed
 * enrichment: real product screenshots (demo sandbox, no chrome redrawn) +
 *   an interactive role explorer (F5 Annotated screenshot, tab-driven)
 * pre-emit critique: P5 H4 E5 S4 R4 V4
 */
import React, { useEffect, useRef, useState } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import ConsentModal from '@/components/public/ConsentModal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '@/data/session';
import { ArrowRight, X } from 'lucide-react';
import PricingTiersSection from '@/components/landing/PricingTiersSection';

const handleSignIn = async () => {
  if (await isAuthenticated()) {
    window.location.href = '/AppHome';
  } else {
    window.location.href = `/Login?next=${encodeURIComponent('/AppHome')}`;
  }
};

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* A soft green wash behind the shot, bleeding past the container's right
          edge — one deliberate grid-break rather than a flat, edge-to-edge paper. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-16 hidden h-[34rem] w-[60vw] overflow-hidden rounded-l-[3rem] bg-[var(--mkt-paper-2)] lg:block"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-4">
            <h1
              className="motion-safe:animate-[mkt-fade-in_550ms_var(--mkt-ease-out)_backwards] font-[var(--mkt-font-display)] font-bold tracking-[-0.03em] text-[var(--mkt-ink)]"
              style={{ fontSize: 'clamp(2.5rem, 4.2vw + 1rem, 3.75rem)', lineHeight: 1.05, animationDelay: '0ms' }}
            >
              One system for every curriculum you teach.
            </h1>
            <p
              className="motion-safe:animate-[mkt-fade-in_550ms_var(--mkt-ease-out)_backwards] mt-5 text-lg text-[var(--mkt-ink-2)] leading-relaxed max-w-md"
              style={{ animationDelay: '80ms' }}
            >
              Gradebooks, timetables, attendance and parent communication — for schools
              running IB, IGCSE, A&#8209;Level and US programmes side by side.
            </p>
            <div
              className="motion-safe:animate-[mkt-fade-in_550ms_var(--mkt-ease-out)_backwards] mt-8 flex flex-wrap items-center gap-4"
              style={{ animationDelay: '160ms' }}
            >
              <Link to="/BookDemo">
                <Button className="h-12 px-7 rounded-lg bg-[var(--mkt-ink)] hover:bg-[var(--mkt-ink)]/90 text-[var(--mkt-paper)] text-base font-medium shadow-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)] focus-visible:ring-offset-2">
                  Book a demo <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={handleSignIn}
                className="h-12 px-2 text-base font-medium text-[var(--mkt-ink-2)] hover:text-[var(--mkt-ink)] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)] focus-visible:ring-offset-2 rounded-md"
              >
                Sign in
              </button>
            </div>
          </div>
          <div
            className="motion-safe:animate-[mkt-fade-in_650ms_var(--mkt-ease-out)_backwards] relative lg:col-span-8"
            style={{ animationDelay: '120ms' }}
          >
            <figure className="rounded-xl border border-[var(--mkt-rule)] shadow-[0_1px_2px_oklch(20%_0.01_150/0.06)] overflow-hidden bg-[var(--mkt-paper-2)]">
              <img
                src="/product/teacher.png"
                alt="A teacher's Scholr dashboard showing assignments to grade, today's schedule and class overview"
                width={1400}
                height={933}
                fetchPriority="high"
                className="block w-full h-auto"
              />
            </figure>
            <div className="absolute -bottom-4 left-6 rounded-lg border border-[var(--mkt-rule)] bg-[var(--mkt-paper)] px-3 py-2 text-xs font-medium text-[var(--mkt-ink-2)] shadow-[0_4px_16px_-6px_oklch(20%_0.03_150/0.25)] sm:left-10">
              Late work is flagged and sorted first — no hunting through a list.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  {
    key: 'teacher',
    label: 'Teacher',
    title: 'Grading, attendance and the day’s schedule in one workspace.',
    body: 'Submissions queue by due date with late work surfaced first. One-click attendance per class, criterion-based feedback, and a running class average — no spreadsheet exports.',
    src: '/product/teacher.png',
    alt: 'Teacher dashboard listing assignments to review, today’s schedule and class overview',
    note: 'Late work is flagged and sorted first.',
  },
  {
    key: 'student',
    label: 'Student',
    title: 'Every deadline, grade and class in one dashboard.',
    body: 'Upcoming work sorted by urgency, predicted grades trending by subject, and today’s timetable — the same view whether a student is doing IB, IGCSE, or A-Levels.',
    src: '/product/student.png',
    alt: 'Student dashboard showing upcoming deadlines, performance by subject and today’s schedule',
    note: 'The most urgent deadline is always pinned to the top.',
  },
  {
    key: 'parent',
    label: 'Parent',
    title: 'Real-time visibility across every child at the school.',
    body: 'Grades, attendance and teacher feedback per child, switchable from one login. No chasing emails for a progress update that’s already on the screen.',
    src: '/product/parent.png',
    alt: 'Parent dashboard showing multiple children, grades, attendance and upcoming deadlines',
    note: 'Switch children from one login — nothing is shared between them.',
  },
  {
    key: 'leader',
    label: 'Leadership',
    title: 'School-wide performance, with problems flagged before they grow.',
    body: 'Subject performance trends term over term, at-risk students surfaced automatically, filterable by year group and subject — the view a head of school actually needs.',
    src: '/product/leader.png',
    alt: 'School leadership dashboard showing subject performance trends and flagged at-risk students',
    note: 'At-risk students are flagged automatically, not hunted for.',
  },
];

function RoleExplorer({ sectionRef }) {
  const [active, setActive] = useState('student');
  const role = ROLES.find((r) => r.key === active) ?? ROLES[0];
  const tabRefs = useRef({});

  const onTabKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + ROLES.length) % ROLES.length;
    const nextRole = ROLES[next];
    setActive(nextRole.key);
    tabRefs.current[nextRole.key]?.focus();
  };

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 border-t border-[var(--mkt-rule)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--mkt-ink)]">
            The same platform, a different screen for every role.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--mkt-ink-2)]">
            Nobody gets a general-purpose dashboard. Pick a role to see what they actually open.
          </p>
        </div>

        <div role="tablist" aria-label="Choose a role" className="mt-8 flex flex-wrap gap-2">
          {ROLES.map((r, i) => {
            const isActive = r.key === active;
            return (
              <button
                key={r.key}
                ref={(el) => (tabRefs.current[r.key] = el)}
                role="tab"
                id={`role-tab-${r.key}`}
                aria-selected={isActive}
                aria-controls={`role-panel-${r.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(r.key)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)] focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-[var(--mkt-ink)] text-[var(--mkt-paper)]'
                    : 'bg-[var(--mkt-paper-2)] text-[var(--mkt-ink-2)] hover:text-[var(--mkt-ink)]'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div
          id={`role-panel-${role.key}`}
          role="tabpanel"
          aria-labelledby={`role-tab-${role.key}`}
          className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
        >
          <div className="lg:col-span-4">
            <h3 className="text-xl font-semibold tracking-[-0.01em] text-[var(--mkt-ink)]">{role.title}</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-ink-2)] max-w-md">{role.body}</p>
          </div>
          <div className="relative lg:col-span-8">
            <figure
              key={role.key}
              className="motion-safe:animate-[mkt-fade-in_360ms_var(--mkt-ease-out)] rounded-xl border border-[var(--mkt-rule)] shadow-[0_1px_2px_oklch(20%_0.01_150/0.06)] overflow-hidden bg-[var(--mkt-paper-2)]"
            >
              <img src={role.src} alt={role.alt} width={1400} height={933} loading="lazy" className="block w-full h-auto" />
            </figure>
            <div className="absolute -bottom-4 left-6 rounded-lg border border-[var(--mkt-rule)] bg-[var(--mkt-paper)] px-3 py-2 text-xs font-medium text-[var(--mkt-ink-2)] shadow-[0_4px_16px_-6px_oklch(20%_0.03_150/0.25)] sm:left-8">
              {role.note}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CAPABILITIES = [
  {
    name: 'Multi-curriculum grading',
    desc: '1–7 IB, A*–E, letter grades and percentages, with predicted-grade tracking and criterion-based rubrics.',
  },
  {
    name: 'IB Core suite',
    desc: 'CAS, Extended Essay and TOK tracked from proposal to final submission, with coordinator approval built in.',
  },
  {
    name: 'Timetable integration',
    desc: 'Syncs with Veracross and iSAMS, resolves scheduling conflicts, and handles exam-period changes.',
  },
  {
    name: 'Internal messaging',
    desc: 'Role-aware threads between teachers, students and parents, with quiet-hours policies and compliance logging.',
  },
  {
    name: 'Enterprise security',
    desc: 'Multi-tenant isolation, audit logging and GDPR export/deletion tools, encrypted at rest and in transit.',
  },
  {
    name: 'Curriculum-aware interface',
    desc: 'IB-only tools stay hidden at IGCSE and A-Level schools. Terminology adapts to your framework automatically.',
  },
];

function CapabilitiesSection() {
  const [first, ...rest] = CAPABILITIES;
  return (
    <Reveal className="py-16 sm:py-24 bg-[var(--mkt-paper-2)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--mkt-ink)] max-w-2xl">
          Underneath the dashboards
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 border-t border-[var(--mkt-rule)]">
          {/* One deliberately wider row — the grid isn't uniform on purpose. */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-[minmax(0,16rem)_1fr] gap-x-8 gap-y-1 py-6 border-b border-[var(--mkt-rule)]">
            <p className="font-medium text-[var(--mkt-ink)]">{first.name}</p>
            <p className="text-[15px] leading-relaxed text-[var(--mkt-ink-2)] max-w-xl">{first.desc}</p>
          </div>
          {rest.map((c) => (
            <div key={c.name} className="py-6 border-b border-[var(--mkt-rule)] sm:odd:pr-8">
              <p className="font-medium text-[var(--mkt-ink)]">{c.name}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--mkt-ink-2)]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[var(--mkt-dark)] py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="font-[var(--mkt-font-display)] font-bold tracking-[-0.02em] text-[var(--mkt-dark-ink)]"
          style={{ fontSize: 'clamp(1.75rem, 2vw + 1.2rem, 2.5rem)', lineHeight: 1.15 }}
        >
          See it running in your school.
        </h2>
        <p className="mt-4 text-[var(--mkt-dark-ink-2)] text-lg">
          A 20-minute walkthrough with your own curriculum mix, not a generic script.
        </p>
        <div className="mt-8">
          <Link to="/BookDemo">
            <Button className="h-12 px-8 rounded-lg bg-[var(--mkt-accent)] hover:bg-[var(--mkt-accent)]/90 text-[var(--mkt-accent-ink)] text-base font-medium shadow-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[var(--mkt-dark-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mkt-dark)]">
              Book a demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function StickyDemoBar({ visible, onDismiss }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--mkt-rule)] bg-[var(--mkt-paper)]/95 backdrop-blur-md shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.22)] px-5 py-3">
          <p className="text-sm font-medium text-[var(--mkt-ink)] truncate">
            See how this looks with your school's curriculum.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/BookDemo">
              <Button className="h-9 px-4 rounded-lg bg-[var(--mkt-ink)] hover:bg-[var(--mkt-ink)]/90 text-[var(--mkt-paper)] text-sm font-medium shadow-none whitespace-nowrap">
                Book a demo
              </Button>
            </Link>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--mkt-ink-3)] hover:text-[var(--mkt-ink)] hover:bg-[var(--mkt-paper-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [barDismissed, setBarDismissed] = useState(false);
  const explorerRef = useRef(null);

  useEffect(() => {
    try {
      // Either answer counts as answered — a decline used to store nothing,
      // so the notice came back on every visit.
      setShowConsent(localStorage.getItem('scholr_consent_accepted') === null);
    } catch {
      setShowConsent(true);
    }
  }, []);

  useEffect(() => {
    const el = explorerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setBarVisible(entry.isIntersecting || entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--mkt-paper)] font-[var(--mkt-font-body)]">
      {/* Two blooms framing the nav at the top of the page — visible at every
          width (not gated behind a breakpoint), fading in once on load and
          drifting a few px on a slow, restrained loop. Sits in normal
          document flow (not fixed) so it scrolls away with the hero rather
          than bleeding into later sections. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
        <div className="mkt-bloom-a absolute -top-24 left-[8%] h-80 w-80 rounded-full bg-[var(--mkt-accent)] opacity-[0.32] blur-3xl sm:h-96 sm:w-96" />
        <div className="mkt-bloom-b absolute -top-16 right-[8%] h-72 w-72 rounded-full bg-[var(--mkt-accent)] opacity-[0.26] blur-3xl sm:h-[26rem] sm:w-[26rem]" />
      </div>

      <div className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center sm:top-6">
        <DetachedNavbar />
      </div>

      <HeroSection />
      <RoleExplorer sectionRef={explorerRef} />
      <CapabilitiesSection />
      <PricingTiersSection />
      <FinalCTA />
      <PublicFooter />

      <StickyDemoBar visible={barVisible && !barDismissed} onDismiss={() => setBarDismissed(true)} />
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}
