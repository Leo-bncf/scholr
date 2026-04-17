import React from 'react';
import { motion } from 'framer-motion';

export default function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.2),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(248,250,252,0.99))]" />

      <motion.div
        className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-blue-300/55 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, 60, 20, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-[22%] right-[6%] h-80 w-80 rounded-full bg-sky-300/55 blur-3xl"
        animate={{ x: [0, -40, 10, 0], y: [0, -20, 40, 0], scale: [1, 0.95, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[10%] left-[22%] h-96 w-96 rounded-full bg-indigo-300/45 blur-3xl"
        animate={{ x: [0, 20, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

    </div>
  );
}