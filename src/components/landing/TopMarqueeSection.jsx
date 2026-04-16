import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";
import MarqueeSparklesBackground from "@/components/landing/MarqueeSparklesBackground";

export default function TopMarqueeSection() {
  return (
    <section className="relative z-10 overflow-hidden bg-transparent pt-56 pb-12 lg:pt-64 lg:pb-16">
      <div className="relative z-10 mx-auto max-w-full isolate">
        <MarqueeSparklesBackground />
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={18}
          tooltipText="Built for international schools"
          fontSize="clamp(2rem, 7vw, 5rem)"
          textColor="#2563eb"
          hoverColor="#0f172a"
          showTooltip={true}
        />
      </div>
    </section>
  );
}