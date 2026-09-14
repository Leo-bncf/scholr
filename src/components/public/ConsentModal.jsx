import React from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsentModal({ isOpen, onClose }) {
  const handleAccept = () => {
    try {
      localStorage.setItem('scholr_consent_accepted', 'true');
    } catch (e) {}
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-[var(--coral-paper)] border border-[var(--coral-rule)] shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.18)] p-6 rounded-2xl z-50"
        >
          <h3 className="text-lg font-semibold text-[var(--coral-ink)] mb-2">We respect your privacy</h3>
          <p className="text-sm text-[var(--coral-ink-2)] mb-6 leading-relaxed">
            We use cookies to improve your experience and analyze platform usage.
            By clicking "Accept", you agree to our use of cookies.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-[var(--coral-rule)] text-[var(--coral-ink)] hover:bg-[var(--coral-paper-2)]" onClick={onClose}>
              Decline
            </Button>
            <Button className="bg-[var(--coral-ink)] hover:bg-[var(--coral-ink)]/90 text-[var(--coral-paper)]" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}