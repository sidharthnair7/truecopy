import { useState, useEffect, useCallback, lazy, Suspense } from "react";

// Lazy-load AeroShards only when WebGPU is confirmed available
const AeroShards = lazy(() => import("@/components/AeroShards/AeroShards"));

/**
 * Static fallback for browsers without WebGPU or when prefers-reduced-motion is set.
 * Renders a static radial/mesh gradient in the same palette as a deliberate "quiet" variant.
 */
function StaticFallback() {
  return (
    <div
      className="w-full h-full"
      style={{
        background: `
          radial-gradient(ellipse at 40% 45%, rgba(200, 214, 185, 0.08) 0%, transparent 55%),
          radial-gradient(ellipse at 65% 60%, rgba(201, 123, 114, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, #0d1512 0%, #0A0A0B 100%)
        `,
      }}
    />
  );
}

export default function HeroBackground() {
  const [canUseWebGPU, setCanUseWebGPU] = useState<boolean | null>(null);
  const [runtimeFailed, setRuntimeFailed] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      setCanUseWebGPU(false);
      return;
    }

    // Check WebGPU support
    const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
    setCanUseWebGPU(hasWebGPU);
  }, []);

  const handleError = useCallback((e: unknown) => {
    console.warn("AeroShards WebGPU init failed, falling back", e);
    setRuntimeFailed(true);
  }, []);

  // Loading state
  if (canUseWebGPU === null) {
    return <StaticFallback />;
  }

  // No WebGPU or runtime failure
  if (!canUseWebGPU || runtimeFailed) {
    return <StaticFallback />;
  }

  return (
    <Suspense fallback={<StaticFallback />}>
      <AeroShards
        backgroundColor="#0A0A0B"
        shardColor="#C8D6B9"
        accentColor="#C97B72"
        placement="full"
        flow="stream"
        material="chrome"
        detail="fine"
        effect="none"
        scale={1.1}
        spread={0.85}
        depth={1}
        speed={0.6}
        spin={0.7}
        interaction="repel"
        density={1.3}
        shardSize={0.95}
        stretch={1.1}
        turbulence={0.5}
        glow={1.2}
        edgeSoftness={2}
        bloom={0.65}
        grain={0.04}
        chromaticAberration={0.005}
        transitionDuration={1.2}
        interactionRadius={1.4}
        interactionStrength={0.4}
        rippleIntensity={0.8}
        holdToGather={true}
        onError={handleError}
      />
    </Suspense>
  );
}
