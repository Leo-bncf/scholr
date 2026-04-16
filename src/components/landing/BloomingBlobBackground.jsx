import React from "react";
import { motion } from "framer-motion";

const blobs = [
  {
    className: "h-[30rem] w-[30rem] bg-blue-300/35 top-[-6rem] left-[-8rem]",
    duration: 18,
    x: [0, 70, -30, 0],
    y: [0, 40, 90, 0],
    scale: [1, 1.12, 0.96, 1],
  },
  {
    className: "h-[26rem] w-[26rem] bg-sky-300/30 top-[18%] right-[-6rem]",
    duration: 22,
    x: [0, -60, 20, 0],
    y: [0, 80, -20, 0],
    scale: [1, 0.94, 1.1, 1],
  },
  {
    className: "h-[24rem] w-[24rem] bg-indigo-300/25 bottom-[8%] left-[16%]",
    duration: 20,
    x: [0, 45, -25, 0],
    y: [0, -60, 20, 0],
    scale: [1, 1.08, 0.92, 1],
  },
  {
    className: "h-[22rem] w-[22rem] bg-cyan-200/30 bottom-[-5rem] right-[10%]",
    duration: 24,
    x: [0, -40, 30, 0],
    y: [0, -30, 50, 0],
    scale: [1, 1.06, 0.95, 1],
  },
];

export default function BloomingBlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(248,250,252,0.75)_38%,_rgba(255,255,255,0.92)_100%)]" />
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{
            opacity: [0.35, 0.65, 0.42, 0.35],
            x: blob.x,
            y: blob.y,
            scale: blob.scale,
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 backdrop-blur-[72px]" />
    </div>
  );
}