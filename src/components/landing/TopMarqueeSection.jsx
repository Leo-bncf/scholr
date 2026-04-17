import React from "react";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 18, reverse: false, fontFamily: 'New York, Times New Roman, serif', textColor: '#1e514b', highlightWords: ['Scholr'], fontSize: "clamp(2.8rem, 9vw, 6.8rem)", letterSpacing: "0.035em" },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 22, reverse: false, fontFamily: 'Times New Roman, Times, serif', textColor: '#1e514b', highlightWords: ['IB', 'IGCSE', 'US'], fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.025em" },
    { text: "SCHOLR", speed: 16, reverse: true, fontFamily: 'New York, Georgia, serif', textColor: '#1e514b', highlightWords: ['SCHOLR'], fontSize: "clamp(2.1rem, 6vw, 5rem)", letterSpacing: "0.05em" },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 20, reverse: true, fontFamily: 'Baskerville, Times New Roman, serif', textColor: '#1e514b', fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.02em" },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 26, reverse: false, fontFamily: 'Cambria, Times New Roman, serif', textColor: '#1e514b', fontSize: "clamp(1.5rem, 4.8vw, 3.75rem)", letterSpacing: "0.02em" },
  ];

  return (
    <section className="relative z-10 overflow-hidden pt-20 pb-8 lg:pt-24 lg:pb-10">
      <div className="relative z-10 mx-auto max-w-full isolate -space-y-10">
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
              textColor="#1b4332"
              hoverColor="#0f172a"
              showTooltip={true}
              highlightWords={[]}
              highlightColor="#1b4332"
              initialDelay={0.15 + index * 0.12}
            />
          </div>
        ))}
      </div>
    </section>
  );
}