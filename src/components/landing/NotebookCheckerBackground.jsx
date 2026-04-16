import React from "react";

export default function NotebookCheckerBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-[-20%] animate-[notebook-drift_22s_linear_infinite] opacity-70">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
              linear-gradient(to right, rgba(148, 163, 184, 0.06) 32px, transparent 32px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 32px, transparent 32px)
            `,
            backgroundSize: "32px 32px, 32px 32px, 160px 160px, 160px 160px",
            backgroundPosition: "0 0, 0 0, 0 0, 0 0",
          }}
        />
      </div>
    </div>
  );
}