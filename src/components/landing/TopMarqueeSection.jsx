import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  return (
    <section className="relative z-10 overflow-hidden bg-transparent pt-36">
      <div className="mx-auto max-w-full">
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={18}
          tooltipText="Built for international schools"
          fontSize="clamp(2rem, 7vw, 5rem)"
          textColor="#ff5a1f"
          hoverColor="#ff5a1f"
          showTooltip={true}
        />
      </div>
    </section>
  );
}