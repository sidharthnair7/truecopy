# TrueCopy frontend

Vite + React + Tailwind v4. The backend runs on `http://localhost:8080`; Vite proxies `/api/*` there, so call relative paths.

```bash
npm install
npm run dev
```

Everything the backend exposes is wrapped in `src/lib/api.js` (`api.auth.*`, `api.videos`, `api.video`, `api.readback`, `api.translate.preview`, `api.gate.*`, `api.runs.*`, plus `pollRun(id, cb)` for live run progress). Endpoint reference and payload shapes are in the root `README.md`.

Set `truecopy.frontend-url=http://localhost:5173` in the backend's `application.properties` so the Google OAuth callback redirects back here with `?auth=connected`.

For a deployed build set `VITE_API_BASE` to the backend origin.
