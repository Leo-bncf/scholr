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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white border border-blue-100 shadow-lg p-6 rounded-2xl z-50"
        >
          <h3 className="text-lg font-bold text-blue-950 mb-2">We respect your privacy</h3>
          <p className="text-sm text-blue-800/80 mb-6 leading-relaxed">
            We use cookies to improve your experience and analyze platform usage. 
            By clicking "Accept", you agree to our use of cookies.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-blue-200 text-blue-900 hover:bg-blue-50" onClick={onClose}>
              Decline
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}