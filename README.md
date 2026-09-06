# TrueCopy

TrueCopy publishes a YouTube channel's titles and descriptions in other languages and **refuses to publish any language it cannot prove is a true copy** of the original: every URL, timestamp, @handle, #hashtag and promo code intact. After publishing it reads the video back from YouTube in the target language, so the proof comes from YouTube, not from the tool.

YouTube gave every creator free auto-dubbing in February 2026. It did not localize their titles. TrueCopy closes that gap safely.

```
enumerate uploads -> for each video, for each language:
  GENERATE   translate title + description (Gemini or Claude, structured JSON output)
  PROTECT    URLs, timestamps, @handles, #hashtags, promo codes extracted first and pinned in the prompt
  VERIFY     deterministic gate: seven rules, no LLM involved
  REFUSE     any failing language is dropped, the failing rule is named
  PUBLISH    videos.update with localizations, fetch-then-update, one call per video
  PROVE      videos.list with hl=<lang>; YouTube must return what was sent
```

## The gate

| Rule | Check |
|---|---|
| `URLS` | Set of URLs identical, order-insensitive |
| `TIMESTAMPS` | Set identical and every timestamp still well-formed (`m:ss`, `h:mm:ss`) |
| `HANDLES` | Every `@handle` preserved |
| `HASHTAGS` | Every `#hashtag` preserved |
| `PROMO_CODES` | Every ALL-CAPS letter+digit code preserved |
| `TITLE_LENGTH` | Non-empty and at most 100 characters |
| `DESCRIPTION_LENGTH` | At most 5000 characters |

The tool makes no claim about translation quality. It makes a falsifiable claim about structural integrity and checks it.

## Setup

Requirements: Java 25, Maven 3.9+, a Google account with a YouTube channel, a Gemini API key (free tier, no billing needed).

1. In [Google Cloud Console](https://console.cloud.google.com/) create a project and enable **YouTube Data API v3**.
2. Configure the OAuth consent screen (External, add your own Google account as a test user).
3. Create credentials: **OAuth client ID**, type **Web application**, authorized redirect URI `http://localhost:8080/api/auth/callback`.
4. Download the client JSON and save it as `client_secret.json` in the project root (git-ignored).
5. Create a Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and put it in `.env` in the project root (git-ignored; copy `.env.example`):
   ```
   GEMINI_API_KEY=your-key
   ```
   The default model `gemini-3.8-flash` is on the free tier. An exported environment variable of the same name also works.
6. Run:

```bash
mvn spring-boot:run
```

Configuration lives in `src/main/resources/application.properties` under the `truecopy.*` prefix: target languages, source language, frontend URL, CORS origins, quota budget, model.

The translator is pluggable. `truecopy.llm.provider=gemini` (default) uses the Gemini REST API with structured JSON output. The free tier has **two caps per model**: about 5 requests per minute, and a small **daily** cap (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`) that a single afternoon of testing can exhaust. TrueCopy therefore paces itself (`truecopy.gemini.requests-per-minute=4`), honours Google's retry hint on per-minute 429s, and **switches to the next model in `truecopy.gemini.models` the moment a daily cap is hit** instead of retrying into a wall. `GET /api/config` shows which model is currently active. Quotas reset at midnight Pacific. `truecopy.llm.provider=anthropic` uses Claude through the official Java SDK (`ANTHROPIC_API_KEY`, model `claude-opus-5`). Both receive the same prompt and the same protected-token list; the gate is identical either way.

`truecopy.frontend-url` is blank by default, so the OAuth callback shows a plain "connected" page. Once the frontend exists, set it (for example `http://localhost:5173`) and the callback redirects there with `?auth=connected` or `?auth=error&reason=...`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/config` | Provider, model, whether the LLM key and client secret are present (never the values), defaults |
| GET | `/api/auth/status` | Is a client secret present, is a channel connected, which one |
| GET | `/api/auth/url` | Google consent URL to open in the browser |
| GET | `/api/auth/callback` | OAuth redirect target; stores the token and redirects to the frontend |
| POST | `/api/auth/disconnect` | Forget the stored token |
| GET | `/api/channel` | Connected channel summary |
| GET | `/api/videos?max=25` | Uploads with existing localization languages |
| GET | `/api/videos/{id}` | Title, description, localizations and the protected tokens found |
| GET | `/api/videos/{id}/readback?hl=es` | What YouTube returns for that video in that language |
| GET | `/api/quota` | Units used this process against the daily budget |
| POST | `/api/translate/preview` | Translate a pasted title/description into one language and run the gate, without touching YouTube |
| POST | `/api/gate/check` | Run the gate on a source/translation pair without touching YouTube |
| POST | `/api/gate/tokens` | Extract protected tokens from any text |
| POST | `/api/runs` | Start a run (returns 202; poll the run) |
| GET | `/api/runs` | All runs, newest first |
| GET | `/api/runs/{id}` | One run with per-video, per-language outcomes |

Start a dry run over the five most recent uploads:

```bash
curl -X POST localhost:8080/api/runs -H "Content-Type: application/json" -d "{\"maxVideos\":5,\"languages\":[\"es\",\"fr\",\"ja\"],\"dryRun\":true}"
```

Publish for one video:

```bash
curl -X POST localhost:8080/api/runs -H "Content-Type: application/json" -d "{\"videoIds\":[\"VIDEO_ID\"],\"languages\":[\"es\",\"fr\",\"ja\"],\"dryRun\":false}"
```

Each language in a run ends as one of `PUBLISHED`, `VERIFIED_DRY_RUN`, `REFUSED` (with the failing rules), `FAILED` (translation or API error) or `SKIPPED` (same as the video's default language). Published languages carry `readbackTitle` and `readbackMatched`.

## Frontend

`frontend/` is a Vite + React + TypeScript app (landing page, `/workspace`, `/playground`). In development run `npm run dev` there (proxies `/api` to `:8080`). `npm run build` writes into `src/main/resources/static`, so the Spring Boot jar serves the site and the API from one origin with a react-router fallback.

## Deploy (one container, judge-safe)

The `Dockerfile` builds the frontend, then the jar, then runs it on a JRE. Any Docker host works (Render, Railway, Fly). Environment:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Free key from aistudio.google.com/apikey |
| `GOOGLE_CLIENT_SECRET_JSON` | Contents of the OAuth client JSON (instead of a file on disk) |
| `OAUTH_REDIRECT_URI` | `https://YOUR-HOST/api/auth/callback` — add it to the Google OAuth client too |
| `GOOGLE_REFRESH_TOKEN` | Optional. Seeds the channel connection on hosts with ephemeral disks. Read it once locally with `ALLOW_TOKEN_EXPORT=true` and `GET /api/auth/export` |
| `ALLOW_LIVE_RUNS` | `false` on a public deployment: dry runs, the playground, readbacks and run history stay open; nothing can be written to the channel |
| `FRONTEND_URL` | Where the OAuth callback redirects; default `/workspace` (same origin) |
| `RUNS_DIR`, `TOKENS_DIR` | Default `/data/runs`, `/data/tokens` in the container; mount a volume there to keep history across restarts |

Local build and run:

```bash
docker build -t truecopy . && docker run -p 8080:8080 --env-file .env -e ALLOW_LIVE_RUNS=false truecopy
```

## Quota

YouTube grants 10,000 units per day per Google Cloud project. `videos.list` costs 1, `videos.update` costs 50 and carries every language for that video in one call. Three languages on one video cost 50 + 3 = 53 units. The meter counts from process start; YouTube resets at midnight Pacific.

## Limitations, stated plainly

- YouTube only. It is the one platform whose API accepts localized metadata.
- Audio tracks are not exposed by the Data API, so target languages are an input, not detected from dubs.
- YouTube requires `snippet.defaultLanguage` before it accepts localizations. If a video has none, TrueCopy sets it to the configured source language and records that it did.
- Existing localizations are preserved (fetch-then-update); a language already present is overwritten only if it is in the run's target list.
- No claim about translation quality. Commercial tools such as ReTranslate gate on human review per language; TrueCopy gates on a deterministic machine check and refuses on its own, which is the only mechanism that scales past the languages the creator can read.

## Tests

```bash
mvn test
```

`GateTest` covers each rule with a hand-written bad translation. `TokenExtractorTest` covers the extractor. The application context test runs without a client secret or API key.
