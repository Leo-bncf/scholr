import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

// Briefly announces the preloaded demo context for the role, then auto-dismisses.
export default function DemoContextBanner({ role }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [role.key]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm ring-1 ${role.accentRing}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-8 w-8 rounded-full ${role.accent} text-white flex items-center justify-center flex-shrink-0`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Demo context loaded</p>
              <p className="text-sm text-slate-800 truncate">{role.contextLine}</p>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}