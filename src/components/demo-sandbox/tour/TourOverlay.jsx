import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const PADDING = 8;
const TOOLTIP_W = 320;
const TOOLTIP_GAP = 14;

// Compute tooltip position relative to target rect.
// Prefer below-target; fall back above if too low; centre if no rect.
const computeTooltipPos = (rect) => {
  if (!rect) {
    return {
      top: window.innerHeight / 2 - 120,
      left: window.innerWidth / 2 - TOOLTIP_W / 2,
      placement: 'center',
    };
  }
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const below = spaceBelow > 240;
  const top = below
    ? rect.top + rect.height + TOOLTIP_GAP
    : Math.max(16, rect.top - 240 - TOOLTIP_GAP);
  let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  left = Math.max(16, Math.min(window.innerWidth - TOOLTIP_W - 16, left));
  return { top, left, placement: below ? 'below' : 'above' };
};

export default function TourOverlay({ active, step, stepIndex, total, rect, onNext, onBack, onDismiss }) {
  const pos = useMemo(() => computeTooltipPos(rect), [rect]);
  if (!active || !step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  // Build the spotlight: four dark rects around the target (we avoid CSS mask for browser compat)
  const spotlight = rect ? (
    <>
      <div className="fixed inset-x-0 top-0 bg-slate-900/55 backdrop-blur-[1px]" style={{ height: Math.max(0, rect.top - PADDING) }} />
      <div
        className="fixed bg-slate-900/55 backdrop-blur-[1px]"
        style={{ top: Math.max(0, rect.top - PADDING), left: 0, width: Math.max(0, rect.left - PADDING), height: rect.height + PADDING * 2 }}
      />
      <div
        className="fixed bg-slate-900/55 backdrop-blur-[1px]"
        style={{ top: Math.max(0, rect.top - PADDING), left: rect.left + rect.width + PADDING, right: 0, height: rect.height + PADDING * 2 }}
      />
      <div
        className="fixed inset-x-0 bg-slate-900/55 backdrop-blur-[1px]"
        style={{ top: rect.top + rect.height + PADDING, bottom: 0 }}
      />
      {/* Highlight ring */}
      <motion.div
        className="fixed rounded-md ring-2 ring-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.25)] pointer-events-none"
        initial={false}
        animate={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  ) : (
    <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-[1px]" />
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour"
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop click skips the tour */}
        <div className="fixed inset-0" onClick={onDismiss} />
        {spotlight}

        {/* Tooltip card */}
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed w-[320px] bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              <Sparkles className="w-3 h-3" />
              Tour · {stepIndex + 1} of {total}
            </div>
            <button
              onClick={onDismiss}
              className="h-6 w-6 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              aria-label="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{step.body}</p>
          </div>
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${i === stepIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              <button
                onClick={isLast ? onDismiss : onNext}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ArrowRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}