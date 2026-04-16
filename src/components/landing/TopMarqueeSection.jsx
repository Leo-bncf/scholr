import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  return (
    <section className="relative z-10 overflow-hidden bg-transparent pt-48 pb-12 lg:pt-56 lg:pb-16">
      <div className="mx-auto max-w-full">
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={18}
          tooltipText="Built for international schools"
          fontSize="clamp(2.75rem, 9vw, 6.75rem)"
          hoverColor="#2563eb"
          showTooltip={true}
        />
      </div>
    </section>
  );
}