import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function MarqueeSparklesBackground() {
  return (
    <div className="fixed inset-x-0 top-0 z-0 pointer-events-none bg-transparent h-screen min-h-screen">
      <div className="absolute inset-0">
        <SparklesCore
          id="landing-marquee-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.8}
          particleDensity={260}
          className="h-full w-full"
          particleColor="#2563eb"
          speed={1.2}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/55 via-30% to-transparent" />
    </div>
  );
}