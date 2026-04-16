"use client";

import { motion } from "framer-motion";

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 4 * position} -${189 + i * 5}C-${380 - i * 4 * position} -${189 + i * 5} -${312 - i * 4 * position} ${216 - i * 5} ${152 - i * 4 * position} ${343 - i * 5}C${616 - i * 4 * position} ${470 - i * 5} ${684 - i * 4 * position} ${875 - i * 5} ${684 - i * 4 * position} ${875 - i * 5}`,
    width: 0.32 + i * 0.018,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="h-full w-full text-blue-700 dark:text-blue-600"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.36 + path.id * 0.012}
            initial={{ pathLength: 0.45, opacity: 0.45 }}
            animate={{
              pathLength: [0.4, 1, 0.85],
              opacity: [0.22, 0.48, 0.3],
              pathOffset: [0, 0.35, 0.12],
            }}
            transition={{
              duration: 24 + path.id * 0.35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
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