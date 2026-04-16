import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function MarqueeSparklesBackground() {
  return (
    <div className="absolute inset-x-0 top-0 z-0 h-48 sm:h-56 lg:h-64 pointer-events-none bg-transparent">
      <div className="absolute inset-x-0 top-0 h-full">
        <SparklesCore
          id="landing-marquee-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.8}
          particleDensity={220}
          className="h-full w-full"
          particleColor="#2563eb"
          speed={1.2}
        />
      </div>
    </div>
  );
}