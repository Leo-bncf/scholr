import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cookie notice.
 *
 * There is no analytics anywhere in this codebase — no PostHog, no Sentry, no
 * Google tag — so the notice doesn't claim to track usage, and "Decline" is
 * recorded rather than dropped (a decline used to store nothing, so the
 * notice came back on every visit).
 */
const KEY = 'scholr_consent_accepted';

export default function ConsentModal({ isOpen, onClose }) {
  const record = (accepted) => {
    try {
      localStorage.setItem(KEY, accepted ? 'true' : 'false');
    } catch {
      // A locked-down browser can refuse storage; the notice just reappears.
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-label="Cookie notice"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-[var(--mkt-paper)] border border-[var(--mkt-rule)] shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.18)] p-6 rounded-2xl z-50"
        >
          <h3 className="text-lg font-semibold text-[var(--mkt-ink)] mb-2">Cookies</h3>
          <p className="text-sm text-[var(--mkt-ink-2)] mb-6 leading-relaxed">
            Scholr uses strictly necessary cookies to keep you signed in. There is no analytics
            or advertising tracking on this site.{' '}
            <Link to="/PrivacyPolicy" className="underline hover:text-[var(--mkt-ink)]">
              Privacy policy
            </Link>
            .
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-[var(--mkt-rule)] text-[var(--mkt-ink)] hover:bg-[var(--mkt-paper-2)]" onClick={() => record(false)}>
              Decline
            </Button>
            <Button className="bg-[var(--mkt-ink)] hover:bg-[var(--mkt-ink)]/90 text-[var(--mkt-paper)]" onClick={() => record(true)}>
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
