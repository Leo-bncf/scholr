import React, { useState } from 'react';
import PublicShell, { Section } from '@/components/public/PublicShell';
import * as demoRequests from '@/data/demoRequests';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * The demo request form — the one page on the public site with a job to do.
 *
 * Kept deliberately plain. Every field is a reason for someone to stop filling
 * it in, so only school name, a name and an email are required; the rest just
 * makes the first call better.
 */

const SIZES = [
  ['small_under_200', 'Under 200 students'],
  ['medium_200_500', '200–500'],
  ['large_500_1000', '500–1,000'],
  ['xlarge_over_1000', 'Over 1,000'],
];

const fieldStyle = {
  width: '100%',
  marginTop: '0.4rem',
  padding: '0.5rem 0.65rem',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--surface)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-control)',
};

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="scholr-label">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-xs" style={{ color: 'var(--faint)' }}>{hint}</span>}
    </label>
  );
}

export default function Demo() {
  const [form, setForm] = useState({
    school_name: '', contact_name: '', email: '', phone: '', country: '',
    school_size: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await demoRequests.create(form);
      setSubmitted(true);
    } catch (err) {
      // The original awaited create() with no catch, so a failed submission
      // showed the thank-you screen anyway and the lead was simply lost.
      console.error('Demo request failed', err);
      setError("We couldn't send that. Please try again, or email hello@scholr.pro directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell>
      <Section>
        <div
          className="grid gap-10 lg:gap-14 items-start"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(19rem, 100%), 1fr))' }}
        >
          <div>
            <p className="scholr-label m-0">Demo</p>
            <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '15ch' }}>
              Thirty minutes, your curriculum
            </h1>
            <p className="m-0 mt-4 text-base leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '46ch' }}>
              Send a timetable and a mark scheme in advance and we will set them up before the
              call, so you are looking at your own subjects and your own grading rather than a demo
              school.
            </p>

            <div className="mt-8" style={{ maxWidth: '34rem' }}>
              {[
                ['Who you will be talking to', 'One of the two people who build it. There is no sales team to hand you on to.'],
                ['What we will cover', 'Your curricula and how they map, what migration from your current system involves, and the price for your roll.'],
                ['What we will not do', 'Claim something is finished when it is not. The security page already lists what is missing; the call is the same.'],
              ].map(([t, d]) => (
                <div key={t} className="py-3.5" style={{ borderTop: '1px solid var(--rule)' }}>
                  <h2 className="m-0 text-base font-medium" style={{ color: 'var(--ink)' }}>{t}</h2>
                  <p className="m-0 mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="scholr-panel p-6">
            {submitted ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-9 h-9 mx-auto" style={{ color: 'var(--good)' }} />
                <h2 className="scholr-h1 m-0 mt-4 text-xl">Got it</h2>
                <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                  We'll be in touch within one working day to find a time.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(11rem, 100%), 1fr))' }}>
                  <Field label="School *">
                    <input required value={form.school_name} onChange={set('school_name')} style={fieldStyle} className="scholr-focus" />
                  </Field>
                  <Field label="Your name *">
                    <input required value={form.contact_name} onChange={set('contact_name')} style={fieldStyle} className="scholr-focus" />
                  </Field>
                </div>

                <Field label="Email *">
                  <input type="email" required value={form.email} onChange={set('email')} style={fieldStyle} className="scholr-focus" />
                </Field>

                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(11rem, 100%), 1fr))' }}>
                  <Field label="Country">
                    <input value={form.country} onChange={set('country')} style={fieldStyle} className="scholr-focus" />
                  </Field>
                  <Field label="Phone">
                    <input value={form.phone} onChange={set('phone')} style={fieldStyle} className="scholr-focus" />
                  </Field>
                </div>

                {/* No curriculum field: `demo_requests` has no column for it, and
                    a schema change does not belong in a redesign. The hint below
                    asks for it in prose instead. */}
                <Field label="Roll">
                  <select value={form.school_size} onChange={set('school_size')} style={fieldStyle} className="scholr-focus">
                    <option value="">—</option>
                    {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>

                <Field label="Anything else" hint="Which curriculum you run, what you're using now, or what's going wrong with it.">
                  <textarea rows={3} value={form.message} onChange={set('message')} style={{ ...fieldStyle, resize: 'vertical' }} className="scholr-focus" />
                </Field>

                {error && (
                  <p
                    role="alert"
                    className="m-0 px-3 py-2 text-sm"
                    style={{
                      background: 'var(--crit-sf)', color: 'var(--crit)',
                      border: '1px solid var(--crit)', borderRadius: 'var(--radius-control)',
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="scholr-focus inline-flex items-center justify-center gap-2 text-sm font-medium"
                  style={{
                    background: 'var(--brand)', color: 'var(--brand-ink)', border: 'none',
                    padding: '0.65rem 1rem', borderRadius: 'var(--radius-control)',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request a demo
                </button>

                <p className="m-0 text-xs" style={{ color: 'var(--faint)' }}>
                  We use these details to arrange the demo and nothing else.
                </p>
              </form>
            )}
          </div>
        </div>
      </Section>
    </PublicShell>
  );
}
