import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { api, LANGUAGE_NAMES, type GateCheck, type Preview, type ProtectedTokens, type RuleFailure } from "@/lib/api";

const SAMPLE_TITLE = "How I Edit Videos 10x Faster";
const SAMPLE_DESCRIPTION = `Get the preset pack here: https://example.com/presets?ref=yt
Use code SAVE20 for 20% off.

0:00 Intro
2:15 The workflow
12:34 Colour grading

Follow me @sidreon and use #TrueCopy #Editing`;

const LANGS = ["es", "fr", "de", "pt", "it", "ja", "ko", "hi"];

function Tokens({ tokens }: { tokens: ProtectedTokens }) {
  const groups: [string, string[]][] = [
    ["URL", tokens.urls],
    ["TIME", tokens.timestamps],
    ["HANDLE", tokens.handles],
    ["TAG", tokens.hashtags],
    ["CODE", tokens.promoCodes],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.flatMap(([label, items]) =>
        items.map((t) => (
          <span key={label + t} className="glass glass--t3-box px-2 py-1 text-[11px] font-mono text-t-green flex items-center gap-1.5">
            <span className="text-[9px] text-grey-400 tracking-widest">{label}</span>
            <span className="truncate max-w-[240px]">{t}</span>
          </span>
        )),
      )}
      {tokens.empty && <span className="text-xs text-grey-600">nothing to protect</span>}
    </div>
  );
}

function Verdict({ passed, failures, label }: { passed: boolean; failures: RuleFailure[]; label: string }) {
  return (
    <motion.div
      key={label + String(passed) + failures.length}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass glass--t3-box rounded-xl px-4 py-3 text-xs font-mono space-y-2 ${passed ? "glass--verified" : "glass--refused"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-grey-400 tracking-widest uppercase">{label}</span>
        <span className={`text-sm font-semibold ${passed ? "text-t-green" : "text-t-red"}`}>{passed ? "VERIFIED" : "REFUSED"}</span>
      </div>
      {failures.map((f, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-grey-400 text-[10px]">RULE</span>
            <span className="text-t-red font-medium">{f.rule}</span>
          </div>
          <p className="text-grey-100 break-words leading-relaxed">{f.detail}</p>
        </div>
      ))}
      {passed && <p className="text-grey-400">Every URL, timestamp, handle, hashtag and promo code survived. Lengths within YouTube limits.</p>}
    </motion.div>
  );
}

export default function Playground() {
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [description, setDescription] = useState(SAMPLE_DESCRIPTION);
  const [language, setLanguage] = useState("es");
  const [sourceTokens, setSourceTokens] = useState<ProtectedTokens | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [recheck, setRecheck] = useState<GateCheck | null>(null);
  const [busy, setBusy] = useState<"translate" | "check" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      api.gate.tokens(`${title}\n${description}`).then(setSourceTokens).catch(() => undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [title, description]);

  const translate = async () => {
    setBusy("translate");
    setError(null);
    setRecheck(null);
    try {
      const p = await api.translate.preview({ title, description, language });
      setPreview(p);
      setEditedTitle(p.title);
      setEditedDescription(p.description);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy("check");
    setError(null);
    try {
      setRecheck(
        await api.gate.check({
          sourceTitle: title,
          sourceDescription: description,
          translatedTitle: editedTitle,
          translatedDescription: editedDescription,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const breakIt = () => {
    let d = editedDescription;
    const url = sourceTokens?.urls[0];
    const ts = sourceTokens?.timestamps[sourceTokens.timestamps.length - 1];
    if (url) d = d.replace(url, url.replace("://", "://" + language + "."));
    if (ts) d = d.replace(ts, ts.replace(":", " min "));
    setEditedDescription(d);
    setRecheck(null);
  };

  const edited = preview !== null && (editedTitle !== preview.title || editedDescription !== preview.description);

  return (
    <main className="min-h-screen bg-bg font-sans">
      <header className="border-b border-grey-800 px-6 py-3 flex items-center justify-between bg-bg-elevated/40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-grey-400 hover:text-grey-100 transition-colors text-sm">← Home</Link>
          <div className="w-px h-4 bg-grey-800" />
          <h1 className="text-sm font-medium text-grey-100 tracking-tight">
            TrueCopy<span className="text-grey-600 font-normal ml-1.5 font-mono">/ gate playground</span>
          </h1>
        </div>
        <Link to="/workspace" className="text-grey-400 hover:text-t-green transition-colors text-xs font-mono">workspace →</Link>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-h3 font-display text-grey-100 mb-1">Try the gate. Then try to fool it.</h2>
          <p className="text-sm text-grey-400 max-w-2xl">
            Paste any title and description, translate it, then edit the translation by hand — change a link, spell out a timestamp, translate a handle — and re-check. The gate is deterministic: it names the rule and the exact token every time. No account needed.
          </p>
        </div>

        {error && (
          <div className="mb-4 glass glass--t3-box glass--refused px-4 py-3 text-xs text-t-red font-mono flex justify-between gap-4">
            <span className="break-words">{error}</span>
            <button onClick={() => setError(null)} className="text-grey-400 hover:text-grey-100">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="glass glass--t2 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] text-grey-400 uppercase tracking-widest font-medium">Source</h3>
            <div>
              <label className="text-[10px] text-grey-600 font-mono block mb-1">title · {title.length}/100</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-bg-elevated border border-grey-800 rounded-lg px-3 py-2 text-sm text-grey-100 focus:border-grey-600 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-grey-600 font-mono block mb-1">description · {description.length}/5000</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={9} className="w-full bg-bg-elevated border border-grey-800 rounded-lg px-3 py-2 text-xs text-grey-100 font-mono focus:border-grey-600 outline-none resize-y" />
            </div>
            <div>
              <span className="text-[10px] text-grey-600 font-mono block mb-2">protected tokens found</span>
              {sourceTokens ? <Tokens tokens={sourceTokens} /> : <span className="text-xs text-grey-600">…</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {LANGS.map((l) => (
                  <button key={l} onClick={() => setLanguage(l)} className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${language === l ? "bg-t-green/15 text-t-green border-t-green/30" : "text-grey-400 border-grey-800 hover:border-grey-600"}`}>
                    {l} <span className="opacity-60">{LANGUAGE_NAMES[l]}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => void translate()} disabled={busy !== null || !title.trim()} className="ml-auto px-5 py-2 rounded-full bg-t-green text-bg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-wait">
                {busy === "translate" ? "Translating…" : "Translate + verify"}
              </button>
            </div>
          </section>

          <section className="glass glass--t2 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-grey-400 uppercase tracking-widest font-medium">Translation · {LANGUAGE_NAMES[preview?.language ?? language]}</h3>
              {preview && <span className="text-[10px] text-grey-600 font-mono">{(preview.translationMillis / 1000).toFixed(1)}s</span>}
            </div>
            {!preview ? (
              <p className="text-xs text-grey-600 py-12 text-center">Translate something to see the gate at work.</p>
            ) : (
              <>
                <Verdict passed={preview.passed} failures={preview.failures} label="gate · model output" />
                <div>
                  <label className="text-[10px] text-grey-600 font-mono block mb-1">translated title · {editedTitle.length}/100 · editable</label>
                  <input value={editedTitle} onChange={(e) => { setEditedTitle(e.target.value); setRecheck(null); }} className="w-full bg-bg-elevated border border-grey-800 rounded-lg px-3 py-2 text-sm text-grey-100 focus:border-grey-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-grey-600 font-mono block mb-1">translated description · editable</label>
                  <textarea value={editedDescription} onChange={(e) => { setEditedDescription(e.target.value); setRecheck(null); }} rows={9} className="w-full bg-bg-elevated border border-grey-800 rounded-lg px-3 py-2 text-xs text-grey-100 font-mono focus:border-grey-600 outline-none resize-y" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={breakIt} className="px-4 py-2 rounded-full border border-t-red/30 text-t-red text-xs font-mono hover:bg-t-red/10">
                    break it for me
                  </button>
                  <button onClick={() => void check()} disabled={busy !== null} className={`ml-auto px-5 py-2 rounded-full text-sm font-medium disabled:opacity-40 ${edited ? "bg-t-green text-bg hover:opacity-90" : "border border-grey-800 text-grey-400"}`}>
                    {busy === "check" ? "Checking…" : "Re-check gate"}
                  </button>
                </div>
                <AnimatePresence>{recheck && <Verdict passed={recheck.passed} failures={recheck.failures} label="gate · your edit" />}</AnimatePresence>
              </>
            )}
          </section>
        </div>

        <p className="text-[11px] text-grey-600 mt-6 max-w-3xl">
          The tool makes no claim about translation quality. It makes a falsifiable claim about structural integrity — URLs, timestamps, @handles, #hashtags, promo codes, and YouTube's length limits — and checks it with no model in the loop. Languages that fail are refused; nothing is published for them.
        </p>
      </div>
    </main>
  );
}
