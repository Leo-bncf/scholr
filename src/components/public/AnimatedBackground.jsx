import React from 'react';
import { Boxes } from "@/components/ui/background-boxes";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-10 bg-slate-50 overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 w-full h-full bg-slate-50 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <div className="absolute inset-0 w-full h-full">
        <Boxes />
      </div>
    </div>
  );
}