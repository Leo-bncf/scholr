import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 18, reverse: false },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 22, reverse: false },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 20, reverse: true },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 26, reverse: false },
  ];

  return (
    <section className="relative z-10 overflow-hidden bg-white pt-56 pb-20 lg:pt-64 lg:pb-24">
      <div className="relative z-10 mx-auto max-w-full isolate space-y-3">
        {marquees.map((marquee, index) => (
          <div key={index} className="py-2">
            <InfiniteTextMarquee
              text={marquee.text}
              speed={marquee.speed}
              reverse={marquee.reverse}
              tooltipText="Built for international schools"
              fontSize="clamp(2rem, 7vw, 5rem)"
              textColor="#2563eb"
              hoverColor="#0f172a"
              showTooltip={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}