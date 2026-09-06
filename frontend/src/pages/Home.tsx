import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SmoothScroll from "@/components/SmoothScroll";
import SectionReveal from "@/components/SectionReveal";
import { GateRuleCard } from "@/components/GateRuleCard";
import { CountUp } from "@/components/CountUp";

const HeroBackground = lazy(() => import("@/components/HeroBackground"));

const PipelineSection = lazy(() => import("@/components/PipelineSection"));

const RULES = [
  {
    title: "URLs",
    before: "youtube.com/watch?v=abc123",
    after: "youtube.punto.com/mira?v=abc123",
  },
  {
    title: "Timestamps",
    before: "12:34",
    after: "douze minutes trente-quatre",
  },
  {
    title: "Handles",
    before: "@creator",
    after: "@creador",
  },
  {
    title: "Hashtags",
    before: "#newvideo",
    after: "#nuevovideo",
  },
  {
    title: "Promo codes",
    before: "SAVE20NOW",
    after: "AHORRA20YA",
  },
  {
    title: "Title length",
    before: "≤ 100 chars",
    after: "142 chars — REFUSED",
  },
  {
    title: "Description length",
    before: "≤ 5,000 chars",
    after: "5,340 chars — REFUSED",
  },
];

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Suspense fallback={
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
            }>
              <HeroBackground />
            </Suspense>
          </div>
          
          <div className="relative z-10 px-6 max-w-4xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass glass--t1 p-8 md:p-12 lg:p-16 text-center max-w-3xl mx-auto flex flex-col items-center"
            >
              {/* Text scrim for legibility */}
              <div className="absolute inset-0 text-scrim pointer-events-none rounded-inherit" />
              
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl lg:text-hero font-display leading-tight mb-6 tracking-tight kinetic-headline text-grey-100">
                  YouTube dubbed your audio for free.
                  <br />
                  <span className="text-grey-400 font-sans text-3xl md:text-4xl lg:text-5xl mt-2 block tracking-normal" style={{fontVariationSettings: 'normal'}}>
                    It did not localize your title.
                  </span>
                </h1>
                
                <p className="text-grey-400 text-base md:text-lg mb-10 max-w-xl mx-auto font-sans">
                  TrueCopy publishes your channel in other languages — and refuses
                  any translation it can&apos;t prove is a true copy.
                </p>
                
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="#pipeline"
                    className="px-6 py-3 rounded-full glass glass--t3 text-sm hover:brightness-110 transition-all duration-200"
                  >
                    See how it works
                  </a>
                  <Link
                    to="/playground"
                    className="px-6 py-3 rounded-full glass glass--t3 text-sm hover:brightness-110 transition-all duration-200"
                  >
                    Try the gate
                  </Link>
                  <Link
                    to="/workspace"
                    className="px-6 py-3 rounded-full bg-t-green text-bg text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-[0_0_20px_rgba(200,214,185,0.4)]"
                  >
                    Connect your channel
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 border border-grey-600 rounded-full flex items-start justify-center p-1.5"
            >
              <div className="w-1 h-1.5 rounded-full bg-grey-400" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════ PROBLEM — bento grid ═══════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 py-32 mesh-gradient-bg">
          <SectionReveal>
            <h2 className="font-display text-h2 mb-4 text-center text-grey-100 heading-reveal">
              The dub arrived. The metadata didn&apos;t.
            </h2>
            <p className="text-grey-400 text-center mb-14 max-w-lg mx-auto text-sm">
              YouTube auto-dubs audio into multiple languages. But titles,
              descriptions, and tags? Still sitting in English.
            </p>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {/* Card 1: Audio tracks mock */}
            <SectionReveal staggerIndex={1}>
              <div className="glass glass--t2 glass-lift rounded-2xl p-6 h-72 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-grey-400 mb-4 font-sans">
                  Audio tracks
                </span>
                <div className="flex-1 rounded-xl bg-grey-800/20 border border-grey-800/50 p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-t-green" />
                    <span className="text-grey-100">English (Original)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-t-green/50" />
                    <span className="text-grey-400">Spanish — Auto-dubbed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-t-green/50" />
                    <span className="text-grey-400">French — Auto-dubbed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-t-green/50" />
                    <span className="text-grey-400">Japanese — Auto-dubbed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-t-green/50" />
                    <span className="text-grey-400">Portuguese — Auto-dubbed</span>
                  </div>
                </div>
              </div>
            </SectionReveal>

            {/* Card 2: Title still in English */}
            <SectionReveal staggerIndex={2}>
              <div className="glass glass--t2 glass-lift rounded-2xl p-6 h-72 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-grey-400 mb-4 font-sans">
                  Title — Unchanged
                </span>
                <div className="flex-1 rounded-xl bg-grey-800/20 border border-grey-800/50 p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-grey-400 block mb-1 font-sans">
                      Audio language
                    </span>
                    <span className="text-xs text-t-green font-mono">Spanish (Auto-dubbed)</span>
                  </div>
                  <div className="separator-glow" />
                  <div>
                    <span className="text-[10px] text-grey-400 block mb-1 font-sans">
                      Video title
                    </span>
                    <span className="text-xs text-t-red font-mono">
                      How I Built This In 48 Hours
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-t-red/70 font-sans">
                    ↳ Still in English. Viewer searching in Spanish won&apos;t find this.
                  </div>
                </div>
              </div>
            </SectionReveal>

            {/* Card 3: Viewer complaint */}
            <SectionReveal staggerIndex={3}>
              <div className="glass glass--t2 glass-lift rounded-2xl p-6 h-72 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-grey-400 mb-4 font-sans">
                  What viewers get instead
                </span>
                <div className="flex-1 rounded-xl bg-grey-800/20 border border-grey-800/50 p-4 flex flex-col justify-between">
                  <div className="text-xs text-grey-400 leading-relaxed font-sans space-y-3">
                    <p>
                      YouTube machine-translates your title and description for foreign viewers by default — and viewers have been publicly asking for a way to turn it off since July 2025.
                    </p>
                    <p className="text-grey-100">
                      A localization you write overrides the machine version. Nobody checks that its links, timestamps and handles survived.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3 font-sans">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-grey-800 text-grey-400 border border-grey-600">
                      auto-dubbing: all creators, Feb 2026
                    </span>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ═══════════════════════ PIPELINE — pinned scroll ═══════════════════════ */}
        <div id="pipeline">
          <Suspense fallback={<div className="h-screen w-full bg-bg" />}>
            <PipelineSection />
          </Suspense>
        </div>

        {/* ═══════════════════════ GATE RULES ═══════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 py-32 mesh-gradient-bg">
          <SectionReveal>
            <h2 className="font-display text-h2 mb-4 text-center text-grey-100 heading-reveal">
              Seven rules. All deterministic.
              <br />
              <span className="text-grey-400 font-sans text-h3 tracking-normal" style={{fontVariationSettings: 'normal'}}>
                No LLM in the safety path.
              </span>
            </h2>
            <p className="text-grey-400 text-center mb-14 max-w-lg mx-auto text-sm">
              Hover a rule to see what makes it fail.
            </p>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {RULES.map((r, i) => (
              <SectionReveal key={r.title} staggerIndex={i}>
                <GateRuleCard {...r} />
              </SectionReveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════ PROOF — restrained, evidentiary ═══════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-32">
          <SectionReveal>
            <h2 className="font-display text-h2 mb-4 text-center text-grey-100 heading-reveal">
              YouTube confirms it.{" "}
              <span className="text-grey-400 font-sans text-h3 tracking-normal block mt-1" style={{fontVariationSettings: 'normal'}}>Not our tool.</span>
            </h2>
            <p className="text-grey-400 text-center mb-14 max-w-lg mx-auto text-sm">
              After publishing, TrueCopy reads the video back from YouTube to
              prove the localized metadata landed exactly as intended.
            </p>
          </SectionReveal>

          <SectionReveal staggerIndex={1}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Terminal output */}
              <div className="rounded-2xl p-6 font-mono text-xs leading-relaxed border border-grey-800 bg-bg-elevated/40">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-grey-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-t-red/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-t-amber/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-t-green/60" />
                  <span className="text-grey-600 ml-2 text-[10px]">
                    terminal
                  </span>
                </div>
                <p className="text-grey-400 mb-2">
                  $ truecopy run --video dQw4w9WgXcQ --lang es,fr,ja
                </p>
                <div className="space-y-1.5">
                  <p className="text-grey-100">
                    <span className="text-grey-600">[generate]</span> 3
                    candidates ready
                  </p>
                  <p className="text-grey-100">
                    <span className="text-grey-600">[protect]</span>{" "}
                    locking tokens…
                  </p>
                  <p className="text-grey-100">
                    <span className="text-grey-600">[verify]</span>{" "}
                    comparing…
                  </p>
                  <div className="my-2 separator-glow" />
                  <p>
                    <span className="text-t-green">✓</span>{" "}
                    <span className="text-grey-100">es</span>{" "}
                    <span className="text-t-green">PUBLISHED</span>
                    <span className="text-grey-600 ml-2">→ readback confirmed</span>
                  </p>
                  <p>
                    <span className="text-t-green">✓</span>{" "}
                    <span className="text-grey-100">fr</span>{" "}
                    <span className="text-t-green">PUBLISHED</span>
                    <span className="text-grey-600 ml-2">→ readback confirmed</span>
                  </p>
                  <p>
                    <span className="text-t-red">✗</span>{" "}
                    <span className="text-grey-100">ja</span>{" "}
                    <span className="text-t-red">REFUSED</span>
                  </p>
                  <p className="text-t-red/70 pl-4">
                    rule: Timestamps
                  </p>
                  <p className="text-t-red/70 pl-4">
                    source: &quot;12:34&quot; → mutated: &quot;十二分三十四秒&quot;
                  </p>
                </div>
              </div>

              {/* Right: Mock YouTube readback */}
              <div className="rounded-2xl p-6 flex flex-col border border-grey-800 bg-bg-elevated/40">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-grey-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-t-red/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-t-amber/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-t-green/60" />
                  <span className="text-grey-600 ml-2 text-[10px] font-mono">
                    youtube.com?hl=es
                  </span>
                </div>

                {/* Mock video player area */}
                <div className="bg-bg rounded-xl aspect-video flex items-center justify-center mb-4 border border-grey-800">
                  <div className="w-12 h-12 rounded-full border-2 border-grey-600 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-grey-400 border-y-[6px] border-y-transparent ml-1" />
                  </div>
                </div>

                {/* Mock video metadata */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-grey-100 font-sans">
                    Cómo construí esto en 48 horas
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-grey-400 font-sans">
                    <span>124K visualizaciones</span>
                    <span>•</span>
                    <span>hace 3 días</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 font-sans">
                    <div className="w-6 h-6 rounded-full bg-grey-800 flex items-center justify-center text-[10px] text-grey-100 border border-grey-600">
                      C
                    </div>
                    <span className="text-xs text-grey-400">
                      @creator
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-t-green/10 text-t-green ml-auto border border-t-green/20">
                      ✓ Readback match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* ═══════════════════════ CASE STUDY STRIP ═══════════════════════ */}
        <section className="py-32 border-t border-b border-grey-800">
          <div className="max-w-5xl mx-auto px-6">
            <SectionReveal>
              <p className="text-center text-grey-400 text-sm mb-3 uppercase tracking-wider font-sans">
                What localized metadata did for one documented channel
              </p>
              <p className="text-center text-grey-600 text-xs mb-12 font-sans">
                Published case study, eight languages, industry-reported figures — not TrueCopy&apos;s own data.
              </p>
            </SectionReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <SectionReveal staggerIndex={1}>
                <div>
                  <CountUp to={195} suffix="%" prefix="+" />
                  <p className="text-grey-400 text-sm mt-3 font-sans">views from localized markets</p>
                </div>
              </SectionReveal>
              <SectionReveal staggerIndex={2}>
                <div>
                  <CountUp to={169} suffix="%" prefix="+" />
                  <p className="text-grey-400 text-sm mt-3 font-sans">ad revenue uplift</p>
                </div>
              </SectionReveal>
              <SectionReveal staggerIndex={3}>
                <div>
                  <CountUp to={126} suffix="%" prefix="+" />
                  <p className="text-grey-400 text-sm mt-3 font-sans">non-English subscribers</p>
                </div>
              </SectionReveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CLOSING CTA ═══════════════════════ */}
        <section className="py-32 text-center px-6">
          <SectionReveal>
            <p className="font-display text-h2 mb-10 max-w-2xl mx-auto leading-snug text-grey-100 heading-reveal">
              AI is probabilistic.
              <br />
              <span className="text-grey-400 tracking-normal" style={{fontVariationSettings: 'normal'}}>
                Publishing infrastructure should not be.
              </span>
            </p>
            <Link
              to="/workspace"
              className="inline-block px-8 py-4 rounded-full bg-t-green text-bg font-medium hover:opacity-90 transition-all duration-200 shadow-[0_0_20px_rgba(200,214,185,0.4)]"
            >
              Connect your channel
            </Link>
          </SectionReveal>
        </section>
      </main>
    </SmoothScroll>
  );
}
