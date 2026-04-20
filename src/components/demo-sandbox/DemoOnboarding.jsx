import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';

export default function DemoOnboarding({ role }) {
  const storageKey = `scholr_demo_onboarding_${role.key}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(storageKey);
      if (!seen) {
        // Small delay so the dashboard renders first, then the overlay slides in
        const t = setTimeout(() => setOpen(true), 450);
        return () => clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const close = () => {
    try { sessionStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  const next = () => {
    if (step < role.onboarding.length - 1) {
      setStep((s) => s + 1);
    } else {
      close();
    }
  };

  const Icon = role.icon;
  const current = role.onboarding[step];
  const isLast = step === role.onboarding.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-24 bg-gradient-to-br ${role.gradient} relative`}>
              <button
                onClick={close}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition"
                aria-label="Skip onboarding"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute -bottom-7 left-6 h-14 w-14 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${role.gradient} text-white flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="pt-10 px-6 pb-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <Sparkles className="w-3 h-3" />
                {role.tagline}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{current.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{current.body}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {role.onboarding.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={close}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Skip tour
                  </button>
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    {isLast ? 'Start exploring' : 'Next'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}