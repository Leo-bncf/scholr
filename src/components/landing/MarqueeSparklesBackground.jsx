import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function MarqueeSparklesBackground() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-0 pointer-events-none bg-transparent h-screen min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <SparklesCore
          id="landing-marquee-sparkles"
          background="transparent"
          minSize={1.2}
          maxSize={3.2}
          particleDensity={150}
          className="h-full w-full"
          particleColor="#2563eb"
          speed={1.2}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent from-0% via-white/55 via-28% to-white to-42%" />
    </div>
  );
}