import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from './useOnboardingStatus';
import { ChevronRight, X } from 'lucide-react';
import Meter from '@/components/app/Meter';

/**
 * Setup progress.
 *
 * Disappears once complete (`isComplete` short-circuits above), which is why
 * it can afford to sit at the top of the dashboard: it is temporary by
 * construction. Completed steps stay visible but recede — the count only means
 * something if you can see what's behind it.
 */
export default function OnboardingChecklist({ schoolId, onDismiss, showWizard }) {
  const navigate = useNavigate();
  const { data, isLoading } = useOnboardingStatus(schoolId);
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading || !data) return null;
  if (data.isComplete) return null;

  const { steps, completedCount, totalCount, progressPct, nextIncomplete } = data;

  return (
    <section className="scholr-panel overflow-hidden">
      <header className="px-4 pt-3.5 pb-3" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
        <div className="flex items-center gap-3">
          <h2 className="scholr-label m-0">Setting up</h2>
          <span
            className="ml-auto text-sm scholr-num"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
          >
            {completedCount}/{totalCount}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Show setup steps' : 'Hide setup steps'}
            className="scholr-focus"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--muted)' }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss the setup checklist"
              className="scholr-focus"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--faint)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2.5">
          <Meter value={progressPct} height={4} />
        </div>
      </header>

      {!collapsed && (
        <div>
          {steps.map((step) => {
            const body = (
              <div
                className="panel-row flex items-baseline gap-3 px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--rule-soft)', opacity: step.completed ? 0.5 : 1 }}
              >
                <span className="min-w-0">
                  <span
                    className="block text-sm font-medium"
                    style={{
                      color: 'var(--ink)',
                      textDecoration: step.completed ? 'line-through' : 'none',
                    }}
                  >
                    {step.label}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{step.detail}</span>
                </span>
                <span className="scholr-label ml-auto shrink-0" style={{ color: step.completed ? 'var(--good)' : 'var(--brand)' }}>
                  {step.completed ? 'Done' : 'To do'}
                </span>
              </div>
            );

            // A completed step isn't a link: there is nothing left to do on it,
            // and a control that looks clickable but isn't is worse than plain
            // text.
            return step.completed ? (
              <div key={step.id}>{body}</div>
            ) : (
              <button
                key={step.id}
                type="button"
                onClick={() => navigate(`/${step.page}`)}
                className="panel-row-link scholr-focus block w-full text-left"
                style={{ background: 'transparent', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}

      {!collapsed && nextIncomplete && (
        <footer
          className="px-4 py-3 flex items-center gap-3 flex-wrap"
          style={{ background: 'var(--surface-sunk)', borderTop: '1px solid var(--rule-soft)' }}
        >
          <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}>
            Next: <span style={{ color: 'var(--ink)' }}>{nextIncomplete.label}</span>
          </p>
          <span className="ml-auto flex items-center gap-2">
            {showWizard && (
              <button
                type="button"
                onClick={showWizard}
                className="scholr-focus text-xs font-medium"
                style={{
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-control)',
                  padding: '0.3rem 0.6rem',
                  background: 'var(--surface)',
                  color: 'var(--body)',
                  cursor: 'pointer',
                }}
              >
                Open wizard
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/${nextIncomplete.page}`)}
              className="scholr-focus inline-flex items-center gap-1 text-xs font-medium"
              style={{
                border: 'none',
                borderRadius: 'var(--radius-control)',
                padding: '0.35rem 0.65rem',
                background: 'var(--brand)',
                color: 'var(--brand-ink)',
                cursor: 'pointer',
              }}
            >
              Continue <ChevronRight className="w-3 h-3" />
            </button>
          </span>
        </footer>
      )}
    </section>
  );
}
