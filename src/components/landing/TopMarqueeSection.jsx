import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 140, 260], [0, 0.35, 1]);
  const y = useTransform(scrollY, [0, 260], [180, 0]);
  const scale = useTransform(scrollY, [0, 260], [0.94, 1]);

  return (
    <section className="pointer-events-none fixed inset-x-0 bottom-0 z-20 overflow-hidden bg-transparent pb-8 lg:pb-12">
      <motion.div
        className="mx-auto max-w-full"
        style={{ opacity, y, scale }}
      >
        <InfiniteTextMarquee
          text="Scholr — Designed for International Schools"
          speed={18}
          tooltipText="Built for international schools"
          fontSize="clamp(2.75rem, 9vw, 6.75rem)"
          hoverColor="#2563eb"
          showTooltip={true}
        />
      </motion.div>
    </section>
  );
}