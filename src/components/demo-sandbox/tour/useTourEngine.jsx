import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lightweight walkthrough engine.
 *
 * - Tracks current step index
 * - Measures the target element's bounding rect (updating on scroll/resize)
 * - Returns null rect if the target isn't found (overlay will centre itself)
 * - Persists a "seen" flag in localStorage keyed by tour id
 */
export default function useTourEngine({ steps, storageKey, autoStart = true }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);
  const lastSelectorRef = useRef(null);

  // Auto-start once per tour id
  useEffect(() => {
    if (!autoStart || !steps?.length) return;
    let seen = false;
    try { seen = !!localStorage.getItem(storageKey); } catch { /* ignore */ }
    if (!seen) {
      const t = setTimeout(() => {
        setStepIndex(0);
        setActive(true);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [autoStart, storageKey, steps]);

  // Measure the target for the active step
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;

    const measure = () => {
      if (!step.selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.selector);
      if (!el) {
        setRect(null);
        return;
      }

      if (lastSelectorRef.current !== step.selector) {
        el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
        lastSelectorRef.current = step.selector;
      }

      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const scheduleMeasure = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('scroll', scheduleMeasure, true);

    return () => {
      window.removeEventListener('resize', scheduleMeasure, true);
      window.removeEventListener('scroll', scheduleMeasure, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, stepIndex, steps]);

  const start = useCallback(() => {
    lastSelectorRef.current = null;
    setStepIndex(0);
    setActive(true);
  }, []);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setActive(false);
  }, [storageKey]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) setStepIndex((s) => s + 1);
    else dismiss();
  }, [stepIndex, steps.length, dismiss]);

  const back = useCallback(() => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  }, [stepIndex]);

  return {
    active,
    stepIndex,
    step: steps?.[stepIndex],
    total: steps?.length || 0,
    rect,
    start,
    next,
    back,
    dismiss,
  };
}