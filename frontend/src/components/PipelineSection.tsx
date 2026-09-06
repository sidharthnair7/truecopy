"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Shield, Search, Ban, Radio, CheckCircle } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  {
    name: "Generate",
    desc: "LLM produces candidate translation for title & description",
    Icon: Zap,
    accent: "t-green",
  },
  {
    name: "Protect",
    desc: "Token-level rules lock every URL, handle, timestamp, hashtag, promo code",
    Icon: Shield,
    accent: "t-green",
  },
  {
    name: "Verify",
    desc: "Candidate compared token-by-token against source material",
    Icon: Search,
    accent: "t-green",
  },
  {
    name: "Refuse",
    desc: "Any mutation → refuse the entire translation, log the rule that caught it",
    Icon: Ban,
    accent: "t-red",
  },
  {
    name: "Publish",
    desc: "Push to YouTube Data API, per-language metadata slot",
    Icon: Radio,
    accent: "t-green",
  },
  {
    name: "Prove",
    desc: "Read back from YouTube, confirm it landed exactly as published",
    Icon: CheckCircle,
    accent: "t-green",
  },
];

export default function PipelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const distance = track.scrollWidth - window.innerWidth;

      const scrollTween = gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${distance}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      // Active card promotion: scale up + stronger glass as it enters center
      const cards = track.querySelectorAll(".pipeline-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.2, scale: 0.88 },
          {
            opacity: 1,
            scale: 1.02,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: "left 70%",
              end: "left 35%",
              scrub: true,
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen overflow-hidden bg-bg mesh-gradient-bg"
    >
      {/* Section heading */}
      <div className="absolute top-12 left-0 right-0 z-10 text-center pointer-events-none">
        <h2 className="font-display text-h2 text-grey-100">
          Six steps. One pipeline.
        </h2>
        <p className="text-grey-400 text-sm mt-2 font-mono tracking-wider">
          SCROLL TO WALK THROUGH EACH STAGE
        </p>
      </div>

      <div
        ref={trackRef}
        className="flex items-center h-full gap-8 px-[10vw] w-max relative z-[1]"
      >
        {STEPS.map((step, i) => {
          const IconComponent = step.Icon;
          return (
            <div
              key={step.name}
              className={`pipeline-card glass glass--t2 glass-lift w-[80vw] md:w-[32vw] h-[55vh] flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden`}
            >
              {/* Top accent bar */}
              <div
                className={`absolute top-0 left-6 right-6 h-px bg-${step.accent}/30`}
              />

              <IconComponent
                size={28}
                strokeWidth={1.5}
                className={`text-${step.accent} mb-5 opacity-70`}
              />

              <span className="text-grey-600 text-xs mb-2 font-mono tracking-widest">
                {String(i + 1).padStart(2, "0")} /{" "}
                {String(STEPS.length).padStart(2, "0")}
              </span>

              <span className="text-3xl md:text-4xl font-display text-grey-100 mb-4">
                {step.name}
              </span>

              <p className="text-grey-400 text-sm text-center max-w-[280px] leading-relaxed px-4">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
