/* Hallmark · genre: editorial · surface: solid paper + hairline grain (replaces
 * the previous floating-orb gradient blobs — banned decoration, no semantic role) */
export default function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-sl-paper">
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-multiply" aria-hidden="true">
        <filter id="sl-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sl-grain)" />
      </svg>
    </div>
  );
}
