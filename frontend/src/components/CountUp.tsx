"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";

export function CountUp({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, to, count]);

  return (
    <span
      ref={ref}
      className="text-5xl md:text-7xl lg:text-8xl font-display tabular-nums text-grey-100"
      style={{
        fontVariationSettings: "'wght' 600, 'opsz' 36",
      }}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
