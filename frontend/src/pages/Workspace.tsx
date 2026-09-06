import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// ─── MOCK DATA (replace with real API calls to your backend) ───
const MOCK_VIDEOS = [
  { id: "v1", title: "How I Built This In 48 Hours", status: "PUBLISHED" as const },
  { id: "v2", title: "The Truth About AI Dubbing", status: "REFUSED" as const, refusedCount: 1 },
  { id: "v3", title: "Behind The Scenes: Studio Tour", status: "PENDING" as const },
  { id: "v4", title: "10 Tools Every Creator Needs", status: "PUBLISHED" as const },
  { id: "v5", title: "Why Auto-Translation Fails", status: "REFUSED" as const, refusedCount: 3 },
  { id: "v6", title: "Q&A: Your Questions Answered", status: "PENDING" as const },
];

const MOCK_REPORTS: Record<
  string,
  {
    lang: string;
    status: "PUBLISHED" | "REFUSED" | "PENDING";
    rule?: string;
    original?: string;
    mutated?: string;
  }[]
> = {
  v1: [
    { lang: "es", status: "PUBLISHED" },
    { lang: "fr", status: "PUBLISHED" },
    { lang: "ja", status: "PUBLISHED" },
    { lang: "pt", status: "PUBLISHED" },
  ],
  v2: [
    { lang: "es", status: "PUBLISHED" },
    { lang: "fr", status: "PUBLISHED" },
    {
      lang: "ja",
      status: "REFUSED",
      rule: "Timestamps",
      original: "12:34",
      mutated: "十二分三十四秒",
    },
    { lang: "pt", status: "PUBLISHED" },
    { lang: "de", status: "PUBLISHED" },
  ],
  v3: [
    { lang: "es", status: "PENDING" },
    { lang: "fr", status: "PENDING" },
    { lang: "ja", status: "PENDING" },
  ],
  v4: [
    { lang: "es", status: "PUBLISHED" },
    { lang: "fr", status: "PUBLISHED" },
  ],
  v5: [
    {
      lang: "es",
      status: "REFUSED",
      rule: "URLs",
      original: "youtube.com/watch?v=abc123",
      mutated: "youtube.punto.com/mira?v=abc123",
    },
    { lang: "fr", status: "PUBLISHED" },
    {
      lang: "ja",
      status: "REFUSED",
      rule: "Handles",
      original: "@creator",
      mutated: "@クリエイター",
    },
    {
      lang: "pt",
      status: "REFUSED",
      rule: "Promo codes",
      original: "SAVE20NOW",
      mutated: "POUPE20AGORA",
    },
  ],
  v6: [
    { lang: "es", status: "PENDING" },
    { lang: "fr", status: "PENDING" },
  ],
};

const PIPELINE_STEPS = ["Generate", "Protect", "Verify", "Refuse", "Publish", "Prove"];

type StepState = "idle" | "running" | "done";

// ─── Status Pill ───
function StatusPill({ status, count }: { status: "PUBLISHED" | "REFUSED" | "PENDING"; count?: number }) {
  const colorMap = {
    PUBLISHED: "glass--verified text-t-green",
    REFUSED: "glass--refused text-t-red",
    PENDING: "text-grey-400",
  };
  return (
    <span className={`glass glass--t3 text-[10px] px-2.5 py-1 rounded-full font-medium ${colorMap[status]}`}>
      {status}
      {count !== undefined && count > 0 && ` (${count})`}
    </span>
  );
}

export default function Workspace() {
  const [isLive, setIsLive] = useState(false);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState(MOCK_VIDEOS[1].id);
  const [stepStates, setStepStates] = useState<StepState[]>(
    PIPELINE_STEPS.map(() => "idle")
  );
  const [isRunning, setIsRunning] = useState(false);

  const selectedVideoData = MOCK_VIDEOS.find((v) => v.id === selectedVideo)!;
  const report = MOCK_REPORTS[selectedVideo] || [];

  // Sequential step animation when "Run" is clicked
  const runPipeline = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setStepStates(PIPELINE_STEPS.map(() => "idle"));
    setExpandedLang(null);

    PIPELINE_STEPS.forEach((_, i) => {
      // Start each step
      setTimeout(() => {
        setStepStates((prev) => {
          const next = [...prev];
          next[i] = "running";
          return next;
        });
      }, i * 600);

      // Complete each step
      setTimeout(() => {
        setStepStates((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
        if (i === PIPELINE_STEPS.length - 1) {
          setIsRunning(false);
        }
      }, i * 600 + 500);
    });
  }, [isRunning]);

  return (
    <main className="min-h-screen bg-bg flex flex-col font-sans">
      {/* ─── Header ─── */}
      <header className="border-b border-grey-800 px-6 py-3 flex items-center justify-between flex-shrink-0 bg-bg-elevated/40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-grey-400 hover:text-grey-100 transition-colors text-sm">
            ← Home
          </Link>
          <div className="w-px h-4 bg-grey-800" />
          <h1 className="text-sm font-medium text-grey-100 tracking-tight">
            TrueCopy
            <span className="text-grey-600 font-normal ml-1.5 font-mono">
              / workspace
            </span>
          </h1>
        </div>
        {/* Mock user avatar — replace with real auth */}
        <div className="w-7 h-7 rounded-full border border-grey-800 bg-grey-800/30 flex items-center justify-center text-[10px] text-grey-400">
          U
        </div>
      </header>

      {/* ─── Dashboard grid ─── */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-6 overflow-auto">
        {/* LEFT RAIL — video list */}
        <aside className="glass glass--t2 rounded-2xl p-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-[10px] text-grey-400 mb-4 uppercase tracking-widest font-medium font-sans">
            Videos
          </h2>
          <div className="space-y-1.5">
            {MOCK_VIDEOS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVideo(v.id);
                  setExpandedLang(null);
                  setStepStates(PIPELINE_STEPS.map(() => "idle"));
                }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  selectedVideo === v.id
                    ? "bg-grey-800/40 border border-grey-600/30"
                    : "hover:bg-grey-800/20 border border-transparent"
                }`}
              >
                <p className="text-sm text-grey-100 truncate mb-1.5 font-sans">
                  {v.title}
                </p>
                <StatusPill
                  status={v.status}
                  count={v.status === "REFUSED" ? v.refusedCount : undefined}
                />
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER — pipeline run view */}
        <section className="glass glass--t2 rounded-2xl p-6 flex flex-col min-h-[400px]">
          {/* Header with title + toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-medium text-grey-100 font-sans">
                Pipeline
              </h2>
              <p className="text-xs text-grey-400 mt-0.5 truncate max-w-[200px] font-mono">
                {selectedVideoData.title}
              </p>
            </div>

            {/* Dry Run / Live Run toggle — deliberately weighty */}
            <button
              onClick={() => setIsLive((v) => !v)}
              className={`relative w-44 h-11 rounded-full transition-colors duration-400 border ${
                isLive
                  ? "bg-t-red/10 border-t-red/20"
                  : "bg-grey-800/20 border-grey-600/30"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`absolute top-1.5 w-[82px] h-8 rounded-full flex items-center justify-center text-xs font-semibold tracking-wide ${
                  isLive
                    ? "bg-t-red text-bg right-1.5 left-auto shadow-[0_0_15px_rgba(201,123,114,0.4)]"
                    : "bg-t-green text-bg left-1.5 right-auto shadow-[0_0_15px_rgba(200,214,185,0.4)]"
                }`}
                style={isLive ? { left: "auto", right: 6 } : { left: 6, right: "auto" }}
              >
                {isLive ? "LIVE RUN" : "DRY RUN"}
              </motion.div>
              {/* Background labels */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-grey-400/50 font-sans">
                DRY
              </span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-grey-400/50 font-sans">
                LIVE
              </span>
            </button>
          </div>

          {/* Pipeline stepper */}
          <div className="flex flex-wrap gap-3 mb-6">
            {PIPELINE_STEPS.map((step, i) => {
              const state = stepStates[i];
              return (
                <motion.div
                  key={step}
                  animate={{
                    opacity: state === "idle" ? 0.5 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`glass glass--t3-box rounded-xl px-4 py-3 flex-1 min-w-[90px] text-center relative overflow-hidden ${
                    state === "running" ? "glass--verified" : ""
                  }`}
                >
                  {/* Running pulse overlay */}
                  {state === "running" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="absolute inset-0 bg-t-green rounded-xl"
                    />
                  )}
                  <span className="text-[10px] text-grey-400 block mb-1 relative z-10 font-mono tracking-widest">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-grey-100 relative z-10 flex items-center justify-center gap-1.5 font-sans">
                    {state === "done" && (
                      <span className="text-t-green text-xs">✓</span>
                    )}
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Run button */}
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-6 ${
              isRunning
                ? "bg-grey-800/20 text-grey-400 cursor-wait border border-transparent"
                : isLive
                ? "bg-t-red/15 text-t-red hover:bg-t-red/25 border border-t-red/20 shadow-[0_0_15px_rgba(201,123,114,0.1)]"
                : "bg-t-green/15 text-t-green hover:bg-t-green/25 border border-t-green/20 shadow-[0_0_15px_rgba(200,214,185,0.1)]"
            }`}
          >
            {isRunning
              ? "Running…"
              : isLive
              ? "Run pipeline (LIVE)"
              : "Run pipeline (dry run)"}
          </button>

          {/* Live mode warning */}
          <AnimatePresence>
            {isLive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="glass glass--t3 glass--amber rounded-lg px-4 py-3 text-xs text-t-amber flex items-center gap-2">
                  <span className="text-[10px]">⚠</span> 
                  Live mode will publish directly to YouTube. Use dry run to preview first.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quota gauge — pinned to bottom */}
          <div className="mt-auto pt-4 border-t border-grey-800/50">
            <div className="flex justify-between text-[10px] text-grey-400 mb-2 font-sans">
              <span>Quota used</span>
              <span className="font-mono">3,400 / 10,000 units</span>
            </div>
            <div className="h-1.5 rounded-full bg-grey-800 overflow-hidden">
              <motion.div
                className="h-full bg-t-green/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "34%" }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </section>

        {/* RIGHT — gate report */}
        <aside className="glass glass--t2 rounded-2xl p-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-[10px] text-grey-400 mb-4 uppercase tracking-widest font-medium font-sans">
            Gate report
          </h2>
          {report.length === 0 ? (
            <p className="text-xs text-grey-600 text-center py-8 font-sans">
              Select a video to view its report
            </p>
          ) : (
            <div className="space-y-1.5">
              {report.map((r) => (
                <div key={r.lang} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedLang(
                        expandedLang === r.lang ? null : r.lang
                      )
                    }
                    className="w-full flex items-center justify-between p-3 bg-grey-800/20 hover:bg-grey-800/40 transition-colors rounded-xl border border-transparent hover:border-grey-600/20"
                  >
                    <span className="text-sm uppercase text-grey-100 font-mono">
                      {r.lang}
                    </span>
                    <StatusPill status={r.status} />
                  </button>

                  <AnimatePresence>
                    {expandedLang === r.lang && r.status === "REFUSED" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="glass glass--t3-box glass--refused mx-1 rounded-lg px-4 py-3 text-xs space-y-2 font-mono mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-grey-400 text-[10px]">
                              RULE
                            </span>
                            <span className="text-t-red font-medium">
                              {r.rule}
                            </span>
                          </div>
                          <div className="separator-glow" />
                          <div>
                            <span className="text-[10px] text-grey-400 block mb-0.5">
                              source
                            </span>
                            <span className="text-t-green">{r.original}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-grey-400 block mb-0.5">
                              mutated
                            </span>
                            <span className="text-t-red line-through">
                              {r.mutated}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
