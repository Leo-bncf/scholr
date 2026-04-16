import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  return (
    <section className="relative z-10 overflow-hidden border-b border-slate-200/70 bg-white/80 pt-4 backdrop-blur-sm">
      <div className="mx-auto max-w-full">
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={18}
          tooltipText="Built for international schools"
          fontSize="clamp(2rem, 7vw, 5rem)"
          hoverColor="#2563eb"
          showTooltip={true}
        />
      </div>
    </section>
  );
}