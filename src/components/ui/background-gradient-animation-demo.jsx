import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation
      containerClassName="min-h-screen w-full"
      className="min-h-screen"
      gradientBackgroundStart="rgb(255, 255, 255)"
      gradientBackgroundEnd="rgb(248, 250, 252)"
      firstColor="37, 99, 235"
      secondColor="59, 130, 246"
      thirdColor="96, 165, 250"
      fourthColor="147, 197, 253"
      fifthColor="191, 219, 254"
      pointerColor="29, 78, 216"
    >
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4 text-center pointer-events-none">
        <p className="bg-gradient-to-b from-slate-900 to-blue-600 bg-clip-text text-3xl font-bold text-transparent drop-shadow-sm md:text-4xl lg:text-7xl">
          Gradients X Animations
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
}