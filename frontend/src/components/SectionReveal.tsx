"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  /** Stagger delay for children (used by parent) */
  staggerIndex?: number;
  staggerDelay?: number;
  width?: "full" | "fit";
}

export default function SectionReveal({
  children,
  className = "",
  delay = 0,
  yOffset = 24,
  staggerIndex = 0,
  staggerDelay = 0.05,
  width = "full",
}: SectionRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const totalDelay = delay + staggerIndex * staggerDelay;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={
        isInView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: yOffset }
      }
      transition={{
        duration: 0.7,
        delay: totalDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${width === "full" ? "w-full" : "w-fit"} ${className}`}
    >
      {children}
    </motion.div>
  );
}
