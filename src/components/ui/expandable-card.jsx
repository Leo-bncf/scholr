"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ExpandableCard({
  title,
  src,
  icon: Icon,
  color = "bg-blue-100 text-blue-500",
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
            className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md h-full w-full z-40"
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
                "w-full max-w-[850px] h-full flex flex-col overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] sm:rounded-t-3xl bg-white shadow-sm dark:shadow-none dark:bg-blue-950 relative",
                classNameExpanded,
              )}
              {...props}
            >
              <motion.div layoutId={`image-${title}-${cardId}`}>
                <div className="relative before:absolute before:inset-x-0 before:bottom-[-1px] before:h-[70px] before:z-50 before:bg-gradient-to-t dark:before:from-blue-950 before:from-white">
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
              <div className="relative h-full before:fixed before:inset-x-0 before:bottom-0 before:h-[70px] before:z-50 before:bg-gradient-to-t dark:before:from-blue-950 before:from-white">
                <div className="flex justify-between items-start p-8 h-auto">
                  <div>
                    <motion.p
                      layoutId={`description-${description}-${cardId}`}
                      className="text-blue-500 dark:text-blue-400 text-lg"
                    >
                      {description}
                    </motion.p>
                    <motion.h3
                      layoutId={`title-${title}-${cardId}`}
                      className="font-semibold text-blue-950 dark:text-white text-4xl sm:text-4xl mt-0.5"
                    >
                      {title}
                    </motion.h3>
                  </div>
                  <motion.button
                    aria-label="Close card"
                    layoutId={`button-${title}-${cardId}`}
                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-blue-950 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 dark:text-white/70 text-blue-950/70 border border-blue-200/90 dark:border-blue-900 hover:border-blue-300/90 hover:text-blue-950 dark:hover:text-white dark:hover:border-blue-800 transition-colors duration-300 focus:outline-none z-50"
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
                    className="text-blue-500 dark:text-blue-400 text-base pb-10 flex flex-col items-start gap-4 overflow-auto "
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
          "p-3 flex flex-col justify-between items-center bg-white shadow-sm dark:shadow-none dark:bg-blue-950 rounded-2xl cursor-pointer border border-blue-100/70 dark:border-blue-900 hover:shadow-md transition-shadow",
          className,
        )}
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
              <div className={cn("w-full h-40 rounded-lg flex items-center justify-center", color)}>
                {Icon && <Icon className="w-16 h-16 opacity-80" />}
              </div>
            )}
          </motion.div>
          <div className="flex justify-between items-center w-full flex-grow">
            <div className="flex flex-col">
              <motion.p
                layoutId={`description-${description}-${cardId}`}
                className="text-blue-500 dark:text-blue-400 md:text-left text-xs font-medium"
              >
                {description}
              </motion.p>
              <motion.h3
                layoutId={`title-${title}-${cardId}`}
                className="text-blue-950 dark:text-white md:text-left font-semibold text-sm mt-1"
              >
                {title}
              </motion.h3>
            </div>
            <motion.button
              aria-label="Open card"
              layoutId={`button-${title}-${cardId}`}
              className={cn(
                "h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-blue-950 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 dark:text-white/70 text-blue-950/70 border border-blue-200/90 dark:border-blue-900 hover:border-blue-300/90 hover:text-blue-950 dark:hover:text-white dark:hover:border-blue-800 transition-colors duration-300  focus:outline-none",
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