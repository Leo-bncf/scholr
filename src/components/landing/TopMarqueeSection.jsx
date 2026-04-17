import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 18, reverse: false, fontFamily: 'Arial Black, Inter, Helvetica, sans-serif', textColor: '#1e514b', highlightWords: ['Scholr'], fontSize: "clamp(2.8rem, 9vw, 6.8rem)", letterSpacing: "0.42em" },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 22, reverse: false, fontFamily: 'Georgia, Times New Roman, serif', textColor: '#1B4332', highlightWords: ['IB', 'IGCSE', 'US'], fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.3em" },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 20, reverse: true, fontFamily: 'Trebuchet MS, Inter, sans-serif', textColor: '#1B4332', fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.28em" },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 26, reverse: false, fontFamily: 'Verdana, Inter, sans-serif', textColor: '#1e514b', fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.28em" },
  ];

  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-10 lg:pt-40 lg:pb-14">
      <div className="relative z-10 mx-auto max-w-full isolate -space-y-9">
        {marquees.map((marquee, index) => (
          <div key={index} className="py-0 [mask-image:linear-gradient(90deg,transparent,white_8%,white_92%,transparent)]">
            <InfiniteTextMarquee
              text={marquee.text}
              speed={marquee.speed}
              reverse={marquee.reverse}
              tooltipText="Built for international schools"
              fontSize={marquee.fontSize || "clamp(1.5rem, 4.8vw, 3.75rem)"}
              fontFamily={marquee.fontFamily}
              letterSpacing={marquee.letterSpacing}
              textColor="rgba(30,81,75,0.34)"
              hoverColor="#0f172a"
              showTooltip={true}
              uppercaseColor="#1e514b"
              highlightWords={marquee.highlightWords || []}
              highlightColor="#1e514b"
              initialDelay={0.15 + index * 0.12}
            />
          </div>
        ))}
      </div>
    </section>
  );
}