import { GrainGradient } from "@paper-design/shaders-react";

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <GrainGradient
        width="100%"
        height="100%"
        fit="cover"
        colors={["#ff6a3d", "#ffb703", "#ff006e", "#7c3aed"]}
        colorBack="#050816"
        softness={0.72}
        intensity={0.38}
        noise={0.18}
        shape="corners"
        speed={1}
        scale={1.15}
        rotation={0}
        offsetX={0}
        offsetY={0}
      />
    </div>
  );
}