import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 18, reverse: false, fontFamily: 'Arial Black, Inter, Helvetica, sans-serif', textColor: '#1e514b', highlightWords: ['Scholr'] },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 22, reverse: false, fontFamily: 'Georgia, Times New Roman, serif', textColor: '#1e514b', highlightWords: ['IB', 'IGCSE', 'US'] },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 20, reverse: true, fontFamily: 'Trebuchet MS, Inter, sans-serif', textColor: '#1e514b' },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 26, reverse: false, fontFamily: 'Verdana, Inter, sans-serif', textColor: '#1e514b' },
  ];

  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-10 lg:pt-40 lg:pb-14">
      <div className="relative z-10 mx-auto max-w-full isolate -space-y-10">
        {marquees.map((marquee, index) => (
          <div key={index} className="py-0">
            <InfiniteTextMarquee
              text={marquee.text}
              speed={marquee.speed}
              reverse={marquee.reverse}
              tooltipText="Built for international schools"
              fontSize="clamp(2rem, 7vw, 5rem)"
              fontFamily={marquee.fontFamily}
              textColor={marquee.textColor}
              hoverColor="#0f172a"
              showTooltip={true}
              uppercaseColor={marquee.textColor}
              highlightWords={marquee.highlightWords || []}
              highlightColor="#000000"
              initialDelay={0.15 + index * 0.12}
            />
          </div>
        ))}
      </div>
    </section>
  );
}