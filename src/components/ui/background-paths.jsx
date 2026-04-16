"use client";

import { motion } from "framer-motion";

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="h-full w-full text-blue-700 dark:text-blue-600"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.44 + path.id * 0.008}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0.55 }}
            animate={{
              opacity: [0.45, 0.7, 0.45],
            }}
            transition={{
              duration: 12 + path.id * 0.18,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "mirror",
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