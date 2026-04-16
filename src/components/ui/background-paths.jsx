"use client";

import { motion } from "framer-motion";

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    d: `M-${420 - i * 3.2 * position} ${-120 + i * 3.5}C${-260 - i * 2.2 * position} ${10 + i * 1.5} ${120 - i * 1.8 * position} ${160 - i * 2.5} ${360 - i * 1.4 * position} ${210 - i * 1.2}C${560 - i * 1.1 * position} ${250 - i * 0.8} ${700 - i * 0.8 * position} ${220 - i * 0.4} ${820 - i * 0.6 * position} ${180 + i * 0.5}`,
    width: 0.28 + i * 0.014,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="h-full w-full text-blue-700 dark:text-blue-600"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.42 + path.id * 0.008}
            initial={{ pathLength: 0.75, opacity: 0 }}
            animate={{
              pathLength: [0.75, 1, 0.9, 0.55],
              opacity: [0, 0.85, 0.65, 0],
              pathOffset: [0, 0.18, 0.45, 0.72],
            }}
            transition={{
              duration: 16 + path.id * 0.18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              times: [0, 0.28, 0.68, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
    </div>
  );
}