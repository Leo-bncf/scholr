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
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-sl-paper border border-sl-rule p-6 rounded-sm z-50 font-landingBody"
        >
          <h3 className="font-landing text-lg font-semibold text-sl-ink mb-2">We respect your privacy</h3>
          <p className="text-sm text-sl-neutral mb-6 leading-relaxed">
            We use cookies to improve your experience and analyse platform usage. By clicking &ldquo;Accept&rdquo;, you agree to our use of cookies.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-sm border-sl-rule bg-sl-paper text-sl-ink hover:bg-sl-paper2 focus-visible:ring-sl-focus" onClick={onClose}>
              Decline
            </Button>
            <Button className="rounded-sm bg-sl-accent text-sl-accentInk hover:bg-sl-ink focus-visible:ring-sl-focus" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
