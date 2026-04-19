import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const uniformFontSize = "clamp(1.8rem, 5.5vw, 4.25rem)";
  const uniformFontSize = "clamp(1.8rem, 5.5vw, 4.25rem)";
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 18, reverse: false, fontFamily: '"Playfair Display", "Didot", serif', letterSpacing: "0.035em" },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 22, reverse: false, fontFamily: '"Courier New", "Courier", monospace', letterSpacing: "0.02em" },
    { text: "Scholr", speed: 16, reverse: true, fontFamily: '"Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif', letterSpacing: "0.08em" },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 20, reverse: true, fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', letterSpacing: "0.01em" },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 26, reverse: false, fontFamily: '"Futura", "Century Gothic", "Trebuchet MS", sans-serif', letterSpacing: "0.04em" },
  ];

  return (
    <section className="relative z-10 overflow-hidden pt-40 pb-8 lg:pt-52 lg:pb-10">
      <div className="relative z-10 mx-auto max-w-full isolate -space-y-10">
        {marquees.map((marquee, index) => (
          <div key={index} className="py-0 [mask-image:linear-gradient(90deg,transparent,white_8%,white_92%,transparent)] [&_.hoverable-text]:[color:rgba(220,242,232,0.72)] [&_.hoverable-text]:[text-shadow:0_0_22px_rgba(120,200,170,0.35)]">
            <InfiniteTextMarquee
              text={marquee.text}
              speed={marquee.speed}
              reverse={marquee.reverse}
              tooltipText="Built for international schools"
              fontSize={uniformFontSize}
              fontFamily={marquee.fontFamily}
              letterSpacing={marquee.letterSpacing}
              textColor="#eef8f4"
              hoverColor="#eef8f4"
              showTooltip={true}
              initialDelay={0.15 + index * 0.12}
            />
          </div>
        ))}
      </div>
    </section>
  );
}