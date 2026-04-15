import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  return (
    <section className="relative z-10 overflow-hidden border-b border-slate-200/70 bg-white/70 pt-28 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl">
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={24}
          tooltipText="Built for international schools"
          fontSize="clamp(2.75rem, 9vw, 7rem)"
          hoverColor="#2563eb"
          showTooltip={true}
        />
      </div>
    </section>
  );
}