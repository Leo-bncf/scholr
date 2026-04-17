import React from 'react';
import { motion } from 'framer-motion';

export default function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.3),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(30,81,75,0.26),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(45,120,111,0.24),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.97),rgba(248,250,252,0.995))]" />

      <motion.div
        className="absolute -top-28 left-[6%] h-[26rem] w-[26rem] rounded-full bg-primary/85 blur-[110px]"
        animate={{ x: [0, 30, -10, 0], y: [0, 60, 20, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-[14%] right-[2%] h-[28rem] w-[28rem] rounded-full bg-primary/75 blur-[120px]"
        animate={{ x: [0, -40, 10, 0], y: [0, -20, 40, 0], scale: [1, 0.95, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[4%] left-[14%] h-[32rem] w-[32rem] rounded-full bg-primary/65 blur-[130px]"
        animate={{ x: [0, 20, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

    </div>
  );
}