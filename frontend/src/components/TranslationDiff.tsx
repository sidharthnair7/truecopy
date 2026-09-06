import { useMemo, type ReactNode } from "react";
import type { ProtectedTokens, RuleFailure } from "@/lib/api";

interface Props {
  sourceTitle: string;
  sourceDescription: string;
  tokens: ProtectedTokens;
  language: string;
  languageName: string;
  translatedTitle?: string | null;
  translatedDescription?: string | null;
  passed: boolean | null;
  failures: RuleFailure[];
  readbackTitle?: string | null;
  readbackMatched?: boolean | null;
}

function allTokens(tokens: ProtectedTokens): string[] {
  return [...tokens.urls, ...tokens.timestamps, ...tokens.handles, ...tokens.hashtags, ...tokens.promoCodes]
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .sort((a, b) => b.length - a.length);
}

function highlight(text: string, tokens: string[], present: (t: string) => boolean): ReactNode[] {
  if (!text) return [];
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) return [text];
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (tokens.includes(part)) {
      const ok = present(part);
      return (
        <mark
          key={i}
          className={`rounded px-1 font-mono not-italic ${ok ? "bg-t-green/15 text-t-green" : "bg-t-red/20 text-t-red line-through"}`}
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function TranslationDiff(p: Props) {
  const tokens = useMemo(() => allTokens(p.tokens), [p.tokens]);
  const translated = `${p.translatedTitle ?? ""}\n${p.translatedDescription ?? ""}`;
  const missing = tokens.filter((t) => !translated.includes(t));
  const inTranslation = (t: string) => translated.includes(t);
  const hasTranslation = p.translatedTitle != null || p.translatedDescription != null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-xl border border-grey-800 bg-bg-elevated/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-grey-400 uppercase tracking-widest">Source</span>
          <span className="text-[11px] text-grey-600 font-mono">{tokens.length} protected token{tokens.length === 1 ? "" : "s"}</span>
        </div>
        <p className="text-sm text-grey-100 leading-snug mb-3">{highlight(p.sourceTitle, tokens, () => true)}</p>
        <p className="text-xs text-grey-400 whitespace-pre-wrap leading-relaxed font-mono">
          {p.sourceDescription ? highlight(p.sourceDescription, tokens, () => true) : <span className="text-grey-600">(no description)</span>}
        </p>
      </div>

      <div className={`rounded-xl border p-4 ${p.passed === false ? "border-t-red/30 bg-t-red/5" : p.passed === true ? "border-t-green/30 bg-t-green/5" : "border-grey-800 bg-bg-elevated/40"}`}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-[11px] text-grey-400 uppercase tracking-widest truncate">
            {p.languageName} <span className="font-mono">({p.language})</span>
          </span>
          {p.passed !== null && (
            <span className={`text-[12px] font-semibold font-mono ${p.passed ? "text-t-green" : "text-t-red"}`}>{p.passed ? "VERIFIED" : "REFUSED"}</span>
          )}
        </div>
        {!hasTranslation ? (
          <p className="text-xs text-grey-600">No translation for this language.</p>
        ) : (
          <>
            <p className="text-sm text-grey-100 leading-snug mb-3">{highlight(p.translatedTitle ?? "", tokens, inTranslation)}</p>
            <p className="text-xs text-grey-400 whitespace-pre-wrap leading-relaxed font-mono">
              {highlight(p.translatedDescription ?? "", tokens, inTranslation)}
            </p>
          </>
        )}
        {missing.length > 0 && hasTranslation && (
          <div className="mt-3 pt-3 border-t border-grey-800/60">
            <span className="text-[11px] text-t-red uppercase tracking-widest block mb-1">Missing from translation</span>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((t) => (
                <span key={t} className="text-[12px] font-mono px-2 py-0.5 rounded bg-t-red/15 text-t-red line-through">{t}</span>
              ))}
            </div>
          </div>
        )}
        {p.failures.length > 0 && (
          <div className="mt-3 pt-3 border-t border-grey-800/60 space-y-2">
            {p.failures.map((f, i) => (
              <div key={i} className="text-xs font-mono">
                <span className="text-t-red font-medium">{f.rule}</span>
                <span className="text-grey-400"> — {f.detail}</span>
              </div>
            ))}
          </div>
        )}
        {p.readbackTitle && (
          <div className="mt-3 pt-3 border-t border-grey-800/60">
            <span className="text-[11px] text-grey-400 uppercase tracking-widest block mb-1">YouTube returned · hl={p.language}</span>
            <p className={`text-xs font-mono ${p.readbackMatched ? "text-t-green" : "text-t-amber"}`}>
              {p.readbackTitle} {p.readbackMatched ? "✓ exact match" : "≠ differs"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
