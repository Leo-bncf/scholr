import { GradientBackground } from "@/components/ui/paper-design-shader-background";

export default function DemoOne() {
  return (
    <main className="relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
      <GradientBackground />
      <div className="absolute inset-0 -z-10 bg-black/20" />

      <section className="px-6">
        <h1 className="text-white text-center text-balance font-light tracking-tight text-5xl">
          Backgrounds are awesome :)
        </h1>
      </section>
    </main>
  );
}