"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ExpandableCard({
  title,
  src,
  icon: Icon,
  color = "bg-sl-accentSoft text-sl-accent",
  description,
  children,
  className,
  classNameExpanded,
  ...props
}) {
  const [active, setActive] = React.useState(false);
  const cardRef = React.useRef(null);
  const cardId = React.useId();

  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActive(false);
      }
    };

    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setActive(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-sl-ink/40 backdrop-blur-sm h-full w-full z-40"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div
            className={cn(
              "fixed inset-0 grid place-items-center z-[100] sm:mt-16 before:pointer-events-none p-4",
            )}
          >
            <motion.div
              layoutId={`card-${title}-${cardId}`}
              ref={cardRef}
              className={cn(
                "w-full max-w-[850px] h-full flex flex-col overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] sm:rounded-sm bg-sl-paper relative",
                classNameExpanded,
              )}
              {...props}
            >
              <motion.div layoutId={`image-${title}-${cardId}`}>
                <div className="relative before:absolute before:inset-x-0 before:bottom-[-1px] before:h-[70px] before:z-50 before:bg-gradient-to-t before:from-sl-paper">
                  {src ? (
                    <img
                      src={src}
                      alt={title}
                      className="w-full h-80 object-cover object-center"
                    />
                  ) : (
                    <div className={cn("w-full h-80 flex items-center justify-center", color)}>
                      {Icon && <Icon className="w-32 h-32 opacity-80" />}
                    </div>
                  )}
                </div>
              </motion.div>
              <div className="relative h-full before:fixed before:inset-x-0 before:bottom-0 before:h-[70px] before:z-50 before:bg-gradient-to-t before:from-sl-paper">
                <div className="flex justify-between items-start p-8 h-auto">
                  <div>
                    <motion.h3
                      layoutId={`title-${title}-${cardId}`}
                      className="font-landing font-semibold text-sl-ink text-4xl sm:text-4xl"
                    >
                      {title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${description}-${cardId}`}
                      className="text-sl-accent text-lg font-landingBody mt-1"
                    >
                      {description}
                    </motion.p>
                  </div>
                  <motion.button
                    aria-label="Close card"
                    layoutId={`button-${title}-${cardId}`}
                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-sl-paper text-sl-accent border border-sl-rule hover:bg-sl-accentSoft hover:border-sl-accent focus-visible:ring-2 focus-visible:ring-sl-focus focus:outline-none transition-colors duration-300 z-50"
                    onClick={() => setActive(false)}
                  >
                    <motion.div
                      animate={{ rotate: active ? 45 : 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </motion.div>
                  </motion.button>
                </div>
                <div className="relative px-6 sm:px-8">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sl-ink font-landingBody text-lg pb-10 flex flex-col items-start gap-4 overflow-auto "
                  >
                    {children}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        role="dialog"
        aria-labelledby={`card-title-${cardId}`}
        aria-modal="true"
        layoutId={`card-${title}-${cardId}`}
        onClick={() => setActive(true)}
        className={cn(
          "p-4 flex flex-col justify-between items-stretch bg-sl-paper2 rounded-sm cursor-pointer border border-sl-rule hover:border-sl-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus",
          className,
        )}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(true); } }}
      >
        <div className="flex gap-4 flex-col w-full h-full">
          <motion.div layoutId={`image-${title}-${cardId}`} className="w-full">
            {src ? (
              <img
                src={src}
                alt={title}
                className="w-full h-40 rounded-lg object-cover object-center"
              />
            ) : (
              <div className={cn("w-full h-28 rounded-sm flex items-center justify-center", color)}>
                {Icon && <Icon className="w-10 h-10 opacity-90" />}
              </div>
            )}
          </motion.div>
          <div className="flex justify-between items-start w-full flex-grow gap-2">
            <div className="flex flex-col">
              <motion.h3
                layoutId={`title-${title}-${cardId}`}
                className="text-sl-ink md:text-left font-landing font-semibold text-base mt-2"
              >
                {title}
              </motion.h3>
              <motion.p
                layoutId={`description-${description}-${cardId}`}
                className="text-sl-neutral md:text-left text-xs font-landingBody mt-0.5"
              >
                {description}
              </motion.p>
            </div>
            <motion.button
              aria-label="Open card"
              layoutId={`button-${title}-${cardId}`}
              tabIndex={-1}
              className={cn(
                "h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-sl-paper text-sl-accent border border-sl-rule transition-colors duration-300 mt-2",
                className,
              )}
            >
              <motion.div
                animate={{ rotate: active ? 45 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}