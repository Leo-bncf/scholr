/* Hallmark · genre: modern-minimal · macrostructure: Workbench · theme: Coral
 * nav: N5 Floating pill · footer: Ft1 Mast-headed
 * enrichment: real product screenshots (demo sandbox, no chrome redrawn)
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
    <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-5">
            <h1
              className="font-[var(--coral-font-display)] font-bold tracking-[-0.03em] text-[var(--coral-ink)]"
              style={{ fontSize: 'clamp(2.25rem, 3.4vw + 1.2rem, 3.5rem)', lineHeight: 1.08 }}
            >
              One system for every curriculum you teach.
            </h1>
            <p className="mt-5 text-lg text-[var(--coral-ink-2)] leading-relaxed max-w-md">
              Gradebooks, timetables, attendance and parent communication — for schools
              running IB, IGCSE, A&#8209;Level and US programmes side by side.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/BookDemo">
                <Button className="h-12 px-7 rounded-lg bg-[var(--coral-ink)] hover:bg-[var(--coral-ink)]/90 text-[var(--coral-paper)] text-base font-medium shadow-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[var(--coral-focus)] focus-visible:ring-offset-2">
                  Book a demo <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={handleSignIn}
                className="h-12 px-2 text-base font-medium text-[var(--coral-ink-2)] hover:text-[var(--coral-ink)] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-focus)] focus-visible:ring-offset-2 rounded-md"
              >
                Sign in
              </button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <figure className="rounded-xl border border-[var(--coral-rule)] shadow-[0_1px_2px_oklch(20%_0.01_40/0.06)] overflow-hidden bg-[var(--coral-paper-2)]">
              <img
                src="/product/teacher.png"
                alt="A teacher's Scholr dashboard showing assignments to grade, today's schedule and class overview"
                width={1400}
                height={933}
                fetchPriority="high"
                className="block w-full h-auto"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function WalkthroughBlock({ eyebrow, title, body, src, alt, align, sentinelRef }) {
  const imageFirst = align === 'right';
  return (
    <Reveal className="py-14 sm:py-20">
      <div ref={sentinelRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className={`lg:col-span-5 ${imageFirst ? 'lg:order-2' : ''}`}>
            <p className="text-sm font-semibold text-[var(--coral-accent)]">{eyebrow}</p>
            <h2 className="mt-2 text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--coral-ink)]">
              {title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--coral-ink-2)] max-w-md">{body}</p>
          </div>
          <div className={`lg:col-span-7 ${imageFirst ? 'lg:order-1' : ''}`}>
            <figure className="rounded-xl border border-[var(--coral-rule)] shadow-[0_1px_2px_oklch(20%_0.01_40/0.06)] overflow-hidden bg-[var(--coral-paper-2)]">
              <img src={src} alt={alt} width={1400} height={933} loading="lazy" className="block w-full h-auto" />
            </figure>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function ProductWalkthrough({ thirdBlockRef }) {
  return (
    <div className="divide-y divide-[var(--coral-rule)]">
      <WalkthroughBlock
        eyebrow="For students"
        title="Every deadline, grade and class in one dashboard."
        body="Upcoming work sorted by urgency, predicted grades trending by subject, and today's timetable — the same view whether a student is doing IB, IGCSE, or A-Levels."
        src="/product/student.png"
        alt="Student dashboard showing upcoming deadlines, performance by subject and today's schedule"
        align="left"
      />
      <div ref={thirdBlockRef}>
        <WalkthroughBlock
          eyebrow="For parents"
          title="Real-time visibility across every child at the school."
          body="Grades, attendance and teacher feedback per child, switchable from one login. No chasing emails for a progress update that's already on the screen."
          src="/product/parent.png"
          alt="Parent dashboard showing multiple children, grades, attendance and upcoming deadlines"
          align="right"
        />
      </div>
      <WalkthroughBlock
        eyebrow="For school leadership"
        title="School-wide performance, with problems flagged before they grow."
        body="Subject performance trends term over term, at-risk students surfaced automatically, filterable by year group and subject — the view a head of school actually needs."
        src="/product/leader.png"
        alt="School leadership dashboard showing subject performance trends and flagged at-risk students"
        align="left"
      />
    </div>
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
  return (
    <Reveal className="py-16 sm:py-24 bg-[var(--coral-paper-2)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--coral-ink)]">
          Underneath the dashboards
        </h2>
        <div className="mt-8 border-t border-[var(--coral-rule)]">
          {CAPABILITIES.map((c) => (
            <div
              key={c.name}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] gap-x-8 gap-y-1 py-5 border-b border-[var(--coral-rule)]"
            >
              <p className="font-medium text-[var(--coral-ink)]">{c.name}</p>
              <p className="text-[15px] leading-relaxed text-[var(--coral-ink-2)]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[var(--coral-dark)] py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="font-[var(--coral-font-display)] font-bold tracking-[-0.02em] text-[var(--coral-dark-ink)]"
          style={{ fontSize: 'clamp(1.75rem, 2vw + 1.2rem, 2.5rem)', lineHeight: 1.15 }}
        >
          See it running in your school.
        </h2>
        <p className="mt-4 text-[var(--coral-dark-ink-2)] text-lg">
          A 20-minute walkthrough with your own curriculum mix, not a generic script.
        </p>
        <div className="mt-8">
          <Link to="/BookDemo">
            <Button className="h-12 px-8 rounded-lg bg-[var(--coral-accent)] hover:bg-[var(--coral-accent)]/90 text-[var(--coral-accent-ink)] text-base font-medium shadow-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[var(--coral-dark-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--coral-dark)]">
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
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--coral-rule)] bg-[var(--coral-paper)]/95 backdrop-blur-md shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.22)] px-5 py-3">
          <p className="text-sm font-medium text-[var(--coral-ink)] truncate">
            See how this looks with your school's curriculum.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/BookDemo">
              <Button className="h-9 px-4 rounded-lg bg-[var(--coral-ink)] hover:bg-[var(--coral-ink)]/90 text-[var(--coral-paper)] text-sm font-medium shadow-none whitespace-nowrap">
                Book a demo
              </Button>
            </Link>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-[var(--coral-ink-3)] hover:text-[var(--coral-ink)] hover:bg-[var(--coral-paper-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-focus)]"
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
  const thirdBlockRef = useRef(null);

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
    const el = thirdBlockRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setBarVisible(entry.isIntersecting || entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--coral-paper)] font-[var(--coral-font-body)]">
      <div className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center sm:top-6">
        <DetachedNavbar />
      </div>

      <HeroSection />
      <ProductWalkthrough thirdBlockRef={thirdBlockRef} />
      <CapabilitiesSection />
      <PricingTiersSection />
      <FinalCTA />
      <PublicFooter />

      <StickyDemoBar visible={barVisible && !barDismissed} onDismiss={() => setBarDismissed(true)} />
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </div>
  );
}
