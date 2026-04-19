import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export const InfiniteTextMarquee = ({
  text = "Let's Get Started",
  link,
  speed = 30,
  reverse = false,
  showTooltip = true,
  tooltipText = "Time to Flex💪",
  fontSize = "8rem",
  textColor = "",
  hoverColor = "",
  fontFamily = 'Arial Black, Inter, Helvetica, sans-serif',
  initialDelay = 0,
  letterSpacing = "0em",
}) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const maxRotation = 8;

  useEffect(() => {
    if (!showTooltip) return;

    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });

      const midpoint = window.innerWidth / 2;
      const distanceFromMidpoint = Math.abs(e.clientX - midpoint);
      const nextRotation = (distanceFromMidpoint / midpoint) * maxRotation;

      setRotation(e.clientX > midpoint ? nextRotation : -nextRotation);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showTooltip]);

  const repeatedText = useMemo(() => {
    const unit = `${text} • `;
    return unit.repeat(6);
  }, [text]);

  const content = (
    <span
      className={`cursor-pointer py-2 m-0 font-black transition-colors ${textColor ? "" : "text-slate-900 dark:text-white"}`}
      style={{
        fontSize,
        color: textColor || undefined,
        fontFamily,
        letterSpacing,
      }}
    >
      <span className="hoverable-text inline-block origin-center">
        {repeatedText}
      </span>
      <span className="hoverable-text inline-block origin-center" aria-hidden="true">
        {repeatedText}
      </span>
    </span>
  );

  return (
    <>
      {showTooltip && typeof document !== "undefined" && createPortal(
        <div
          className={`pointer-events-none fixed z-[9999] rounded-3xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-opacity duration-300 md:px-12 md:py-6 md:text-base ${isHovered ? "opacity-100" : "opacity-0"}`}
          style={{
            top: `${cursorPosition.y}px`,
            left: `${cursorPosition.x}px`,
            transform: `rotateZ(${rotation}deg) translate(-50%, -140%)`,
          }}
        >
          <p>{tooltipText}</p>
        </div>,
        document.body
      )}

      <div className="relative w-full overflow-hidden">
        <motion.div
          className="whitespace-nowrap origin-center marquee-track"
          initial={{ opacity: 0, y: 42 }}
          animate={{ opacity: 1, y: 0 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          transition={{
            opacity: { duration: 0.7, delay: initialDelay, ease: "easeOut" },
            y: { duration: 0.7, delay: initialDelay, ease: "easeOut" },
          }}
          style={{
            animation: `${reverse ? 'marquee-reverse' : 'marquee'} ${speed}s linear infinite`,
            animationDelay: `${initialDelay}s`,
            willChange: 'transform',
          }}
        >
          {link ? (
            <a href={link} className="block" target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div className="block">{content}</div>
          )}
        </motion.div>

        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes marquee-reverse {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          .hoverable-text:hover {
            color: ${hoverColor || "hsl(var(--primary))"};
          }
        `}</style>
      </div>
    </>
  );
};