import React from 'react';
import { motion } from 'framer-motion';

export default function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,94,84,0.52),transparent_38%),radial-gradient(circle_at_82%_18%,rgba(30,81,75,0.38),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(56,161,105,0.34),transparent_32%),linear-gradient(to_bottom,rgba(11,54,48,0.90),rgba(16,76,67,0.88),rgba(28,110,97,0.82))]" />

      <motion.div
        className="absolute -top-24 left-[8%] h-80 w-80 rounded-full bg-emerald-400/55 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, 60, 20, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-[18%] right-[4%] h-[24rem] w-[24rem] rounded-full bg-teal-300/45 blur-3xl"
        animate={{ x: [0, -40, 10, 0], y: [0, -20, 40, 0], scale: [1, 0.95, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[8%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/40 blur-3xl"
        animate={{ x: [0, 20, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

    </div>
  );
}