import * as React from "react";
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
  uppercaseColor = '',
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

  const repeatedText = useMemo(() => Array(12).fill(text).join(" • ") + " •", [text]);
  const styledText = useMemo(() => repeatedText.split('').map((char, index) => (
    /[A-Z]/.test(char) ? (
      <span key={`${char}-${index}`} style={{ color: uppercaseColor || '#000000' }}>{char}</span>
    ) : (
      <span key={`${char}-${index}`}>{char}</span>
    )
  )), [repeatedText, uppercaseColor]);

  const content = (
    <span
      className={`cursor-pointer py-2 m-0 font-black tracking-[-0.04em] transition-colors ${textColor ? "" : "text-slate-900 dark:text-white"}`}
      style={{
        fontSize,
        color: textColor || undefined,
        fontFamily,
      }}
    >
      <span
        className="hoverable-text inline-block transition-transform duration-500 ease-out origin-center"
        style={{
          color: undefined,
        }}
      >
        {styledText}
      </span>
    </span>
  );

  return (
    <>
      {showTooltip && (
        <div
          className={`pointer-events-none fixed z-[99] rounded-3xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-opacity duration-300 md:px-12 md:py-6 md:text-base ${isHovered ? "opacity-100" : "opacity-0"}`}
          style={{
            top: `${cursorPosition.y}px`,
            left: `${cursorPosition.x}px`,
            transform: `rotateZ(${rotation}deg) translate(-50%, -140%)`,
          }}
        >
          <p>{tooltipText}</p>
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <motion.div
          className="whitespace-nowrap origin-center"
          initial={{ opacity: 0, y: 42, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: 0,
            x: reverse ? [-1000, 0] : [0, -1000],
            scale: 1,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          transition={{
            opacity: {
              duration: 0.7,
              delay: initialDelay,
              ease: "easeOut",
            },
            y: {
              duration: 0.7,
              delay: initialDelay,
              ease: "easeOut",
            },
            x: {
              repeat: Infinity,
              duration: speed,
              ease: "linear",
              delay: initialDelay,
            },
            scale: {
              duration: 0.45,
              ease: "easeOut",
            },
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
          .hoverable-text:hover {
            color: ${hoverColor || "hsl(var(--primary))"};
          }
        `}</style>
      </div>
    </>
  );
};