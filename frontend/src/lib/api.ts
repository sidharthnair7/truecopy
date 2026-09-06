const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type Outcome = "PUBLISHED" | "VERIFIED_DRY_RUN" | "REFUSED" | "FAILED" | "SKIPPED";

export interface RuleFailure {
  rule: string;
  detail: string;
}

export interface ProtectedTokens {
  urls: string[];
  timestamps: string[];
  handles: string[];
  hashtags: string[];
  promoCodes: string[];
  empty: boolean;
}

export interface LanguageResult {
  language: string;
  outcome: Outcome;
  title?: string | null;
  description?: string | null;
  failures: RuleFailure[];
  readbackTitle?: string | null;
  readbackMatched?: boolean | null;
  error?: string | null;
  translationMillis: number;
}

export interface VideoResult {
  videoId: string;
  sourceTitle: string;
  thumbnailUrl?: string | null;
  defaultLanguage: string;
  defaultLanguageSet: boolean;
  languages: LanguageResult[];
  quotaUsed: number;
  error?: string | null;
}

export interface Run {
  id: string;
  status: RunStatus;
  dryRun: boolean;
  sourceLanguage: string;
  languages: string[];
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  videosRequested: number;
  videosProcessed: number;
  attempted: number;
  published: number;
  refused: number;
  failed: number;
  skipped: number;
  quotaUsed: number;
  quotaBudget: number;
  error?: string | null;
  videos: VideoResult[];
}

export interface VideoSummary {
  id: string;
  title: string;
  publishedAt?: string | null;
  privacyStatus?: string | null;
  defaultLanguage?: string | null;
  defaultAudioLanguage?: string | null;
  thumbnailUrl?: string | null;
  localizedLanguages: string[];
}

export interface VideoDetail {
  id: string;
  title: string;
  description: string;
  publishedAt?: string | null;
  privacyStatus?: string | null;
  defaultLanguage?: string | null;
  defaultAudioLanguage?: string | null;
  thumbnailUrl?: string | null;
  localizations: Record<string, { title: string; description: string }>;
  protectedTokens: ProtectedTokens;
}

export interface Config {
  llmProvider: string;
  llmModel: string;
  llmModels: string[];
  llmKeyPresent: boolean;
  googleClientSecretPresent: boolean;
  liveRunsAllowed: boolean;
  sourceLanguage: string;
  defaultLanguages: string[];
  quotaBudget: number;
  redirectUri: string;
  frontendUrl: string;
}

export interface AuthStatus {
  configured: boolean;
  connected: boolean;
  channelId?: string | null;
  channelTitle?: string | null;
  redirectUri: string;
  message?: string | null;
}

export interface Readback {
  videoId: string;
  hl: string;
  title: string;
  description: string;
}

export interface Preview {
  language: string;
  title: string;
  description: string;
  passed: boolean;
  failures: RuleFailure[];
  protectedTokens: ProtectedTokens;
  translationMillis: number;
}

export interface GateCheck {
  passed: boolean;
  failures: RuleFailure[];
  sourceTokens: ProtectedTokens;
  translatedTokens: ProtectedTokens;
}

export interface Quota {
  used: number;
  budget: number;
  remaining: number;
  listCost: number;
  updateCost: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(body?.message ?? `${res.status} ${res.statusText}`, res.status);
  }
  return body as T;
}

const get = <T,>(path: string) => request<T>(path);
const post = <T,>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

export const api = {
  config: () => get<Config>("/api/config"),
  quota: () => get<Quota>("/api/quota"),
  auth: {
    status: () => get<AuthStatus>("/api/auth/status"),
    url: () => get<{ url: string }>("/api/auth/url"),
    disconnect: () => post<{ connected: boolean }>("/api/auth/disconnect"),
  },
  videos: (max = 25) => get<VideoSummary[]>(`/api/videos?max=${max}`),
  video: (id: string) => get<VideoDetail>(`/api/videos/${encodeURIComponent(id)}`),
  readback: (id: string, hl: string) =>
    get<Readback>(`/api/videos/${encodeURIComponent(id)}/readback?hl=${encodeURIComponent(hl)}`),
  translate: {
    preview: (body: { title: string; description: string; language: string; sourceLanguage?: string }) =>
      post<Preview>("/api/translate/preview", body),
  },
  gate: {
    check: (body: {
      sourceTitle: string;
      sourceDescription: string;
      translatedTitle: string;
      translatedDescription: string;
    }) => post<GateCheck>("/api/gate/check", body),
    tokens: (text: string) => post<ProtectedTokens>("/api/gate/tokens", { text }),
  },
  runs: {
    start: (body: {
      videoIds?: string[];
      languages?: string[];
      sourceLanguage?: string;
      maxVideos?: number;
      dryRun: boolean;
    }) => post<Run>("/api/runs", body),
    list: () => get<Run[]>("/api/runs"),
    get: (id: string) => get<Run>(`/api/runs/${encodeURIComponent(id)}`),
  },
};

export function pollRun(id: string, onUpdate: (run: Run) => void, intervalMs = 2000): () => void {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const run = await api.runs.get(id);
      onUpdate(run);
      if (run.status === "COMPLETED" || run.status === "FAILED") return;
    } catch {
      /* transient */
    }
    if (!stopped) setTimeout(tick, intervalMs);
  };
  void tick();
  return () => {
    stopped = true;
  };
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  ar: "Arabic",
  zh: "Chinese",
  ru: "Russian",
  id: "Indonesian",
  tr: "Turkish",
};
