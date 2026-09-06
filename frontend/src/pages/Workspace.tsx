import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  api,
  pollRun,
  LANGUAGE_NAMES,
  type AuthStatus,
  type Config,
  type LanguageResult,
  type Outcome,
  type ProtectedTokens,
  type Quota,
  type Readback,
  type Run,
  type VideoDetail,
  type VideoSummary,
} from "@/lib/api";

const PIPELINE_STEPS = ["Generate", "Protect", "Verify", "Refuse", "Publish", "Prove"];
const LANGUAGE_CHOICES = ["es", "fr", "de", "pt", "it", "ja", "ko", "hi"];

type StepState = "idle" | "running" | "done" | "skipped";

function pillClass(outcome: Outcome | "PENDING") {
  switch (outcome) {
    case "PUBLISHED":
    case "VERIFIED_DRY_RUN":
      return "glass--verified text-t-green";
    case "REFUSED":
      return "glass--refused text-t-red";
    case "FAILED":
      return "glass--amber text-t-amber";
    default:
      return "text-grey-400";
  }
}

function pillLabel(outcome: Outcome | "PENDING") {
  return outcome === "VERIFIED_DRY_RUN" ? "VERIFIED · DRY" : outcome;
}

function StatusPill({ outcome, count }: { outcome: Outcome | "PENDING"; count?: number }) {
  return (
    <span className={`glass glass--t3 text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${pillClass(outcome)}`}>
      {pillLabel(outcome)}
      {count !== undefined && count > 0 && ` (${count})`}
    </span>
  );
}

function TokenChips({ tokens }: { tokens: ProtectedTokens }) {
  const groups: [string, string[]][] = [
    ["URL", tokens.urls],
    ["TIME", tokens.timestamps],
    ["HANDLE", tokens.handles],
    ["TAG", tokens.hashtags],
    ["CODE", tokens.promoCodes],
  ];
  if (tokens.empty) {
    return (
      <p className="text-xs text-t-amber font-sans">
        Nothing to protect: this description has no URLs, timestamps, handles, hashtags or promo codes. Add some in YouTube Studio to see the gate work.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.flatMap(([label, items]) =>
        items.map((t) => (
          <span key={label + t} className="glass glass--t3-box px-2 py-1 text-[11px] font-mono text-t-green flex items-center gap-1.5 max-w-full">
            <span className="text-[9px] text-grey-400 tracking-widest">{label}</span>
            <span className="truncate max-w-[220px]">{t}</span>
          </span>
        )),
      )}
    </div>
  );
}

function stepStates(run: Run | null): StepState[] {
  if (!run) return PIPELINE_STEPS.map(() => "idle");
  const video = run.videos[run.videos.length - 1];
  const anyPublished = run.videos.some((v) => v.languages.some((l) => l.outcome === "PUBLISHED"));
  const anyProved = run.videos.some((v) => v.languages.some((l) => l.readbackMatched === true));
  if (run.status === "QUEUED") return ["running", "idle", "idle", "idle", "idle", "idle"];
  if (run.status === "RUNNING") {
    if (!video) return ["running", "running", "idle", "idle", "idle", "idle"];
    return ["done", "done", "done", "done", run.dryRun ? "skipped" : "running", "idle"];
  }
  if (run.status === "FAILED") return ["done", "done", "idle", "idle", "idle", "idle"];
  return [
    "done",
    "done",
    "done",
    "done",
    run.dryRun ? "skipped" : anyPublished ? "done" : "skipped",
    run.dryRun ? "skipped" : anyProved ? "done" : "skipped",
  ];
}

export default function Workspace() {
  const [params] = useSearchParams();
  const [config, setConfig] = useState<Config | null>(null);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readback, setReadback] = useState<Readback | null>(null);
  const [readbackLang, setReadbackLang] = useState<string>("en");
  const [readbackLoading, setReadbackLoading] = useState(false);
  const stopPolling = useRef<(() => void) | null>(null);

  const isRunning = activeRun?.status === "QUEUED" || activeRun?.status === "RUNNING";

  const refreshQuota = useCallback(() => {
    api.quota().then(setQuota).catch(() => undefined);
  }, []);

  const loadRuns = useCallback(() => {
    api.runs.list().then(setRuns).catch(() => undefined);
  }, []);

  const loadVideos = useCallback(async () => {
    setVideosLoading(true);
    try {
      const list = await api.videos(25);
      setVideos(list);
      if (list.length > 0) setSelectedId((cur) => cur ?? list[0].id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  useEffect(() => {
    api.config()
      .then((c) => {
        setConfig(c);
        setLanguages(c.defaultLanguages);
      })
      .catch((e) => setError((e as Error).message));
    api.auth.status().then(setAuth).catch((e) => setError((e as Error).message));
    refreshQuota();
    loadRuns();
    if (params.get("auth") === "error") setError(`Google sign-in failed: ${params.get("reason") ?? "unknown"}`);
  }, [params, refreshQuota, loadRuns]);

  useEffect(() => {
    if (auth?.connected) void loadVideos();
  }, [auth?.connected, loadVideos]);

  useEffect(() => {
    if (!selectedId) return;
    setDetail(null);
    setReadback(null);
    setReadbackLang("en");
    setExpandedLang(null);
    setDetailLoading(true);
    api.video(selectedId)
      .then(setDetail)
      .catch((e) => setError((e as Error).message))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => () => stopPolling.current?.(), []);

  const connect = async () => {
    try {
      const { url } = await api.auth.url();
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toggleLanguage = (code: string) =>
    setLanguages((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));

  const startRun = async (scope: "video" | "channel") => {
    if (isRunning || languages.length === 0) return;
    setError(null);
    setExpandedLang(null);
    setReadback(null);
    try {
      const run = await api.runs.start({
        videoIds: scope === "video" && selectedId ? [selectedId] : undefined,
        maxVideos: scope === "channel" ? 5 : undefined,
        languages,
        dryRun: !isLive,
      });
      setActiveRun(run);
      stopPolling.current?.();
      stopPolling.current = pollRun(run.id, (r) => {
        setActiveRun(r);
        if (r.status === "COMPLETED" || r.status === "FAILED") {
          refreshQuota();
          loadRuns();
          if (!r.dryRun) void loadVideos();
        }
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const showReadback = async (lang: string) => {
    if (!selectedId) return;
    setReadbackLang(lang);
    setReadbackLoading(true);
    try {
      setReadback(await api.readback(selectedId, lang));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReadbackLoading(false);
    }
  };

  const steps = useMemo(() => stepStates(activeRun), [activeRun]);
  const selectedVideo = videos.find((v) => v.id === selectedId) ?? null;
  const reportVideos = activeRun?.videos ?? [];
  const selectedReport = reportVideos.find((v) => v.videoId === selectedId) ?? reportVideos[0] ?? null;
  const publishedLangs = selectedReport?.languages.filter((l) => l.outcome === "PUBLISHED").map((l) => l.language) ?? [];
  const availableLangs = useMemo(() => {
    const set = new Set<string>(["en", ...(detail ? Object.keys(detail.localizations) : []), ...publishedLangs]);
    return Array.from(set);
  }, [detail, publishedLangs]);
  const quotaPct = quota ? Math.min(100, Math.round((quota.used / quota.budget) * 100)) : 0;
  const liveAllowed = config?.liveRunsAllowed ?? true;

  return (
    <main className="min-h-screen bg-bg flex flex-col font-sans">
      <header className="border-b border-grey-800 px-6 py-3 flex items-center justify-between flex-shrink-0 bg-bg-elevated/40 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-grey-400 hover:text-grey-100 transition-colors text-sm whitespace-nowrap">
            ← Home
          </Link>
          <div className="w-px h-4 bg-grey-800" />
          <h1 className="text-sm font-medium text-grey-100 tracking-tight whitespace-nowrap">
            TrueCopy
            <span className="text-grey-600 font-normal ml-1.5 font-mono">/ workspace</span>
          </h1>
          <Link to="/playground" className="text-grey-400 hover:text-t-green transition-colors text-xs font-mono whitespace-nowrap hidden md:inline">
            gate playground →
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs min-w-0">
          {config && (
            <span className="font-mono text-grey-400 hidden lg:inline truncate">
              {config.llmProvider} / {config.llmModel}
            </span>
          )}
          {auth?.connected ? (
            <span className="glass glass--t3 glass--verified px-3 py-1 text-t-green whitespace-nowrap">
              ● {auth.channelTitle}
            </span>
          ) : (
            <button
              onClick={connect}
              disabled={!auth?.configured}
              className="px-4 py-1.5 rounded-full bg-t-green text-bg font-medium hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            >
              Connect YouTube
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 glass glass--t3-box glass--refused px-4 py-3 text-xs text-t-red font-mono flex items-start justify-between gap-4">
          <span className="break-words">{error}</span>
          <button onClick={() => setError(null)} className="text-grey-400 hover:text-grey-100">✕</button>
        </div>
      )}

      {auth && !auth.connected && (
        <div className="mx-6 mt-4 glass glass--t2 rounded-2xl p-6 text-sm text-grey-400">
          <p className="text-grey-100 mb-2">No channel connected.</p>
          <p className="mb-4">
            {auth.configured
              ? "Connect a YouTube channel to list uploads and run the pipeline. Nothing is written until you run in LIVE mode."
              : auth.message}
          </p>
          <p className="text-xs">
            Want to try the gate without a channel? <Link to="/playground" className="text-t-green underline">Open the playground</Link>.
          </p>
        </div>
      )}

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6 overflow-auto">
        <aside className="glass glass--t2 rounded-2xl p-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] text-grey-400 uppercase tracking-widest font-medium">Videos</h2>
            {auth?.connected && (
              <button onClick={() => void loadVideos()} className="text-[10px] text-grey-600 hover:text-grey-100 font-mono">
                {videosLoading ? "…" : "refresh"}
              </button>
            )}
          </div>
          {videos.length === 0 ? (
            <p className="text-xs text-grey-600 py-6 text-center">{auth?.connected ? (videosLoading ? "Loading uploads…" : "No uploads found") : "Connect to load uploads"}</p>
          ) : (
            <div className="space-y-1.5">
              {videos.map((v) => {
                const inRun = activeRun?.videos.find((r) => r.videoId === v.id);
                const refused = inRun?.languages.filter((l) => l.outcome === "REFUSED").length ?? 0;
                const pub = inRun?.languages.filter((l) => l.outcome === "PUBLISHED" || l.outcome === "VERIFIED_DRY_RUN").length ?? 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      selectedId === v.id ? "bg-grey-800/40 border border-grey-600/30" : "hover:bg-grey-800/20 border border-transparent"
                    }`}
                  >
                    <div className="flex gap-3">
                      {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-16 h-9 object-cover rounded-md flex-shrink-0 opacity-80" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-grey-100 truncate mb-1">{v.title}</p>
                        <div className="flex flex-wrap gap-1 items-center">
                          {v.localizedLanguages.filter((l) => l !== (v.defaultLanguage ?? "en")).map((l) => (
                            <span key={l} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-grey-800/60 text-grey-400 uppercase">{l}</span>
                          ))}
                          {inRun && refused > 0 && <StatusPill outcome="REFUSED" count={refused} />}
                          {inRun && refused === 0 && pub > 0 && <StatusPill outcome={activeRun?.dryRun ? "VERIFIED_DRY_RUN" : "PUBLISHED"} />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="glass glass--t2 rounded-2xl p-6 flex flex-col min-h-[480px]">
          <div className="flex items-start justify-between mb-5 gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-medium text-grey-100">Pipeline</h2>
              <p className="text-xs text-grey-400 mt-0.5 truncate font-mono">{selectedVideo?.title ?? "Select a video"}</p>
            </div>
            <button
              onClick={() => liveAllowed && setIsLive((v) => !v)}
              disabled={!liveAllowed}
              title={liveAllowed ? "Toggle dry run / live run" : "Live writes are disabled on this deployment"}
              className={`relative w-44 h-11 rounded-full transition-colors duration-400 border flex-shrink-0 ${
                isLive ? "bg-t-red/10 border-t-red/20" : "bg-grey-800/20 border-grey-600/30"
              } ${liveAllowed ? "" : "opacity-50 cursor-not-allowed"}`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`absolute top-1.5 w-[82px] h-8 rounded-full flex items-center justify-center text-xs font-semibold tracking-wide ${
                  isLive ? "bg-t-red text-bg shadow-[0_0_15px_rgba(201,123,114,0.4)]" : "bg-t-green text-bg shadow-[0_0_15px_rgba(200,214,185,0.4)]"
                }`}
                style={isLive ? { left: "auto", right: 6 } : { left: 6, right: "auto" }}
              >
                {isLive ? "LIVE RUN" : "DRY RUN"}
              </motion.div>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-grey-400/50">DRY</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-grey-400/50">LIVE</span>
            </button>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-grey-400 uppercase tracking-widest">Protected in this video</span>
              {detailLoading && <span className="text-[10px] text-grey-600 font-mono">reading…</span>}
            </div>
            {detail ? <TokenChips tokens={detail.protectedTokens} /> : <p className="text-xs text-grey-600">—</p>}
            {detail && detail.description && (
              <p className="text-[11px] text-grey-600 mt-2 line-clamp-2 font-mono whitespace-pre-line">{detail.description}</p>
            )}
          </div>

          <div className="mb-5">
            <span className="text-[10px] text-grey-400 uppercase tracking-widest block mb-2">Target languages</span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_CHOICES.map((code) => {
                const on = languages.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggleLanguage(code)}
                    disabled={isRunning}
                    className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                      on ? "bg-t-green/15 text-t-green border-t-green/30" : "text-grey-400 border-grey-800 hover:border-grey-600"
                    }`}
                  >
                    {code} <span className="text-[10px] opacity-60">{LANGUAGE_NAMES[code]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {PIPELINE_STEPS.map((step, i) => {
              const state = steps[i];
              return (
                <motion.div
                  key={step}
                  animate={{ opacity: state === "idle" ? 0.45 : state === "skipped" ? 0.35 : 1 }}
                  transition={{ duration: 0.3 }}
                  className={`glass glass--t3-box rounded-xl px-3 py-2.5 flex-1 min-w-[84px] text-center relative overflow-hidden ${
                    state === "running" ? "glass--verified" : ""
                  }`}
                >
                  {state === "running" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.12, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="absolute inset-0 bg-t-green rounded-xl"
                    />
                  )}
                  <span className="text-[10px] text-grey-400 block mb-0.5 relative z-10 font-mono tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-xs text-grey-100 relative z-10 flex items-center justify-center gap-1">
                    {state === "done" && <span className="text-t-green">✓</span>}
                    {state === "skipped" && <span className="text-grey-600">–</span>}
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => void startRun("video")}
              disabled={isRunning || !auth?.connected || !selectedId || languages.length === 0}
              className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed ${
                isLive
                  ? "bg-t-red/15 text-t-red hover:bg-t-red/25 border-t-red/20"
                  : "bg-t-green/15 text-t-green hover:bg-t-green/25 border-t-green/20"
              }`}
            >
              {isRunning ? "Running…" : isLive ? "Publish this video (LIVE)" : "Dry run this video"}
            </button>
            <button
              onClick={() => void startRun("channel")}
              disabled={isRunning || !auth?.connected || languages.length === 0}
              className="py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-grey-800 text-grey-400 hover:text-grey-100 hover:border-grey-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLive ? "Publish latest 5 (LIVE)" : "Dry run latest 5"}
            </button>
          </div>

          <AnimatePresence>
            {isLive && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="glass glass--t3-box glass--amber rounded-lg px-4 py-3 text-xs text-t-amber">
                  ⚠ Live mode writes localizations to YouTube with one <span className="font-mono">videos.update</span> per video (50 quota units), then reads each language back to prove it landed.
                </div>
              </motion.div>
            )}
            {!liveAllowed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                <div className="glass glass--t3-box rounded-lg px-4 py-3 text-xs text-grey-400">
                  Live writes are disabled on this deployment. Dry runs, the gate playground and the run history are open.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeRun && (
            <div className="glass glass--t3-box rounded-xl px-4 py-3 mb-4 text-xs font-mono flex flex-wrap gap-x-5 gap-y-1 text-grey-400">
              <span>run <span className="text-grey-100">{activeRun.id}</span></span>
              <span>{activeRun.status}</span>
              <span>{activeRun.videosProcessed}/{activeRun.videosRequested} videos</span>
              <span className="text-t-green">{activeRun.published} verified</span>
              <span className="text-t-red">{activeRun.refused} refused</span>
              {activeRun.failed > 0 && <span className="text-t-amber">{activeRun.failed} failed</span>}
              {activeRun.error && <span className="text-t-red break-all">{activeRun.error}</span>}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-grey-800/50">
            <div className="flex justify-between text-[10px] text-grey-400 mb-2">
              <span>YouTube quota used this session</span>
              <span className="font-mono">{quota ? `${quota.used.toLocaleString()} / ${quota.budget.toLocaleString()} units` : "…"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-grey-800 overflow-hidden">
              <motion.div className="h-full bg-t-green/60 rounded-full" animate={{ width: `${Math.max(quotaPct, quota && quota.used > 0 ? 1 : 0)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
        </section>

        <aside className="space-y-6 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="glass glass--t2 rounded-2xl p-4">
            <h2 className="text-[10px] text-grey-400 mb-4 uppercase tracking-widest font-medium">Gate report</h2>
            {!selectedReport ? (
              <p className="text-xs text-grey-600 text-center py-8">{isRunning ? "Translating and verifying…" : "Run the pipeline to see the report"}</p>
            ) : (
              <div className="space-y-1.5">
                {reportVideos.length > 1 && <p className="text-[10px] text-grey-600 font-mono mb-2 truncate">{selectedReport.sourceTitle}</p>}
                {selectedReport.error && <p className="text-xs text-t-red font-mono mb-2 break-words">{selectedReport.error}</p>}
                {selectedReport.defaultLanguageSet && (
                  <p className="text-[10px] text-t-amber font-mono mb-2">defaultLanguage was unset; set to {selectedReport.defaultLanguage}</p>
                )}
                {selectedReport.languages.map((r) => (
                  <LanguageRow key={r.language} result={r} expanded={expandedLang === r.language} onToggle={() => setExpandedLang(expandedLang === r.language ? null : r.language)} />
                ))}
              </div>
            )}
          </div>

          {detail && auth?.connected && (
            <div className="glass glass--t2 rounded-2xl p-4">
              <h2 className="text-[10px] text-grey-400 mb-1 uppercase tracking-widest font-medium">What a viewer sees</h2>
              <p className="text-[10px] text-grey-600 mb-3">Read live from YouTube with <span className="font-mono">hl=</span> — this is YouTube confirming it, not the tool claiming it.</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {availableLangs.map((l) => (
                  <button
                    key={l}
                    onClick={() => void showReadback(l)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                      readbackLang === l && readback ? "bg-t-green/15 text-t-green border-t-green/30" : "text-grey-400 border-grey-800 hover:border-grey-600"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden border border-grey-800 bg-bg-elevated">
                {detail.thumbnailUrl && <img src={detail.thumbnailUrl} alt="" className="w-full aspect-video object-cover opacity-90" />}
                <div className="p-3">
                  {readbackLoading ? (
                    <p className="text-xs text-grey-600 font-mono">reading from YouTube…</p>
                  ) : readback ? (
                    <>
                      <p className="text-sm text-grey-100 leading-snug mb-1">{readback.title}</p>
                      <p className="text-[11px] text-grey-400 whitespace-pre-line line-clamp-4">{readback.description}</p>
                      <p className="text-[9px] text-grey-600 font-mono mt-2 uppercase">hl={readback.hl} · videos.list</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-grey-100 leading-snug mb-1">{detail.title}</p>
                      <p className="text-[11px] text-grey-400 whitespace-pre-line line-clamp-4">{detail.description || "(no description)"}</p>
                      <p className="text-[9px] text-grey-600 font-mono mt-2 uppercase">source · pick a language above</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {runs.length > 0 && (
            <div className="glass glass--t2 rounded-2xl p-4">
              <h2 className="text-[10px] text-grey-400 mb-3 uppercase tracking-widest font-medium">Run history</h2>
              <div className="space-y-1">
                {runs.slice(0, 8).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRun(r);
                      setExpandedLang(null);
                      const first = r.videos[0]?.videoId;
                      if (first && videos.some((v) => v.id === first)) setSelectedId(first);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono flex items-center gap-3 hover:bg-grey-800/30 ${activeRun?.id === r.id ? "bg-grey-800/40" : ""}`}
                  >
                    <span className="text-grey-100">{r.id}</span>
                    <span className={r.dryRun ? "text-grey-400" : "text-t-red"}>{r.dryRun ? "dry" : "LIVE"}</span>
                    <span className="text-t-green">{r.published}✓</span>
                    <span className="text-t-red">{r.refused}✕</span>
                    <span className="ml-auto text-grey-600">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function LanguageRow({ result, expanded, onToggle }: { result: LanguageResult; expanded: boolean; onToggle: () => void }) {
  const name = LANGUAGE_NAMES[result.language] ?? result.language;
  return (
    <div className="rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 bg-grey-800/20 hover:bg-grey-800/40 transition-colors rounded-xl border border-transparent hover:border-grey-600/20 gap-2">
        <span className="text-sm text-grey-100 font-mono flex items-baseline gap-2 min-w-0">
          <span className="uppercase">{result.language}</span>
          <span className="text-[10px] text-grey-600 truncate">{name}</span>
        </span>
        <span className="flex items-center gap-2">
          {result.readbackMatched === true && <span className="text-[10px] text-t-green font-mono" title="YouTube returned exactly what was sent">proved</span>}
          {result.readbackMatched === false && <span className="text-[10px] text-t-amber font-mono">mismatch</span>}
          <StatusPill outcome={result.outcome} count={result.failures.length || undefined} />
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className={`glass glass--t3-box mx-1 rounded-lg px-4 py-3 text-xs space-y-3 font-mono mt-1 ${result.outcome === "REFUSED" ? "glass--refused" : result.outcome === "FAILED" ? "glass--amber" : "glass--verified"}`}>
              {result.failures.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-grey-400 text-[10px]">RULE</span>
                    <span className="text-t-red font-medium">{f.rule}</span>
                  </div>
                  <p className="text-grey-100 break-words leading-relaxed">{f.detail}</p>
                </div>
              ))}
              {result.error && <p className="text-t-amber break-words">{result.error}</p>}
              {result.title && (
                <div>
                  <span className="text-[10px] text-grey-400 block mb-0.5">translated title</span>
                  <p className={result.outcome === "REFUSED" ? "text-grey-400" : "text-t-green"}>{result.title}</p>
                </div>
              )}
              {result.description && (
                <div>
                  <span className="text-[10px] text-grey-400 block mb-0.5">translated description</span>
                  <p className="text-grey-100 whitespace-pre-line line-clamp-6 leading-relaxed">{result.description}</p>
                </div>
              )}
              {result.readbackTitle && (
                <div>
                  <span className="text-[10px] text-grey-400 block mb-0.5">YouTube returned (hl={result.language})</span>
                  <p className={result.readbackMatched ? "text-t-green" : "text-t-amber"}>{result.readbackTitle}</p>
                </div>
              )}
              {result.translationMillis > 0 && <p className="text-[10px] text-grey-600">{(result.translationMillis / 1000).toFixed(1)}s</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
