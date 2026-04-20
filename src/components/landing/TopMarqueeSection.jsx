import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InfiniteTextMarquee } from "@/components/ui/infinite-text-marquee";

export default function TopMarqueeSection() {
  const uniformFontSize = "clamp(1.8rem, 5.5vw, 4.25rem)";
  const marquees = [
    { text: "Scholr — Designed for International Schools", speed: 320, reverse: false, fontFamily: '"Georgia", "Times New Roman", serif', letterSpacing: "0.02em" },
    { text: "Built for IB, IGCSE, A-Levels, and US Curricula", speed: 420, reverse: false, fontFamily: '"Bodoni MT", "Bodoni 72", "Didot", serif', letterSpacing: "0.05em" },
    { text: "Scholr", speed: 40, reverse: true, fontFamily: '"Palatino", "Palatino Linotype", "Book Antiqua", serif', letterSpacing: "0.12em" },
    { text: "Role-Based Dashboards for Students, Teachers, Parents, and Admins", speed: 400, reverse: true, fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive', letterSpacing: "0.015em" },
    { text: "Assignments, Gradebooks, Reports, Messaging, and Timetables in One Place", speed: 500, reverse: false, fontFamily: '"Copperplate", "Copperplate Gothic Light", "Optima", sans-serif', letterSpacing: "0.08em" },
  ];

  const [isHovered, setIsHovered] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [maxWidth, setMaxWidth] = useState(9999);
  const tooltipRef = useRef(null);
  const maxRotation = 8;

  useEffect(() => {
    if (!isHovered) return;
    const handleMove = (e) => {
      setCursor({ x: e.clientX, y: e.clientY });
      const mid = window.innerWidth / 2;
      const dist = Math.abs(e.clientX - mid);
      const next = (dist / mid) * maxRotation;
      setRotation(e.clientX > mid ? next : -next);

      // Tooltip is centered on cursor (translate -50%). It only overflows the edge
      // when distToEdge < tooltipWidth/2. Cap width only in that case.
      const distToEdge = Math.min(e.clientX, window.innerWidth - e.clientX);
      const tooltipWidth = tooltipRef.current?.offsetWidth ?? 0;
      const halfWidth = tooltipWidth / 2;
      const threshold = halfWidth + 60;
      if (distToEdge >= threshold) {
        setMaxWidth(9999);
      } else {
        setMaxWidth(Math.max(200, (distToEdge - 60) * 2));
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isHovered]);

  return (
    <section className="relative z-10 overflow-hidden pt-40 pb-8 lg:pt-52 lg:pb-10">
      <div
        className="relative z-10 mx-auto max-w-full -space-y-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {marquees.map((marquee, index) => (
          <div key={index} className="py-0 [mask-image:linear-gradient(90deg,transparent,white_8%,white_92%,transparent)] [&_.hoverable-text]:[color:rgba(238,248,244,0.65)] [&_.hoverable-text:hover]:![color:rgb(238,248,244)]">
            <InfiniteTextMarquee
              text={marquee.text}
              speed={marquee.speed}
              reverse={marquee.reverse}
              fontSize={uniformFontSize}
              fontFamily={marquee.fontFamily}
              letterSpacing={marquee.letterSpacing}
              hoverColor="#eef8f4"
              showTooltip={false}
              initialDelay={0.15 + index * 0.12}
            />
          </div>
        ))}
      </div>

      {typeof document !== "undefined" && createPortal(
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
          <div
            ref={tooltipRef}
            className={`pointer-events-none absolute rounded-3xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-opacity duration-300 md:px-12 md:py-6 md:text-base ${isHovered ? "opacity-100" : "opacity-0"}`}
            style={{
              top: `${cursor.y}px`,
              left: `${cursor.x}px`,
              maxWidth: `${maxWidth}px`,
              transform: `rotateZ(${rotation}deg) translate(-50%, -140%)`,
            }}
          >
            <p>Built for international schools</p>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}