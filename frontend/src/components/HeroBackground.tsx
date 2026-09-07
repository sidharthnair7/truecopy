import Topography from "@/components/Topography/Topography";

/**
 * Hero background: a WebGL topographic field on a paper ground. The elevation
 * ramp runs green to ochre to brick, the way a real relief map is coloured,
 * and the cursor raises a bump in the field so the contours bend around it.
 */
export default function HeroBackground() {
  return (
    <div className="w-full h-full ambient-field">
      <div className="ambient-wash ambient-wash--a" />
      <div className="ambient-wash ambient-wash--b" />
      <Topography
        lowColor="#3F6B45"
        midColor="#7A5B12"
        highColor="#A63A2E"
        speed={0.25}
        morphAmount={2.5}
        morphSpeed={0.04}
        bands={2.5}
        thickness={0.015}
        scale={1.1}
        pixelSize={1.0}
        glow={0.4}
        colorMode="elevation"
        contrast={2.2}
        brightness={1.0}
        fillBands={false}
        opacity={0.38}
        grain={false}
        grainIntensity={0.03}
        mouseInteraction={true}
        mouseRadius={0.35}
        mouseStrength={0.35}
      />
      <div className="ambient-fade" />
    </div>
  );
}
