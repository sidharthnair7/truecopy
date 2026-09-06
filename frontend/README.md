# TrueCopy frontend

Vite + React 18 + TypeScript + Tailwind 3 + framer-motion. Routes: `/` landing, `/workspace` product, `/playground` gate playground.

```bash
npm install
npm run dev
```

Dev server is `http://localhost:5173` and proxies `/api/*` to the backend on `:8080`. For OAuth to return here in dev, start the backend with `FRONTEND_URL=http://localhost:5173/workspace`.

`npm run build` writes into `../src/main/resources/static`, so the Spring Boot jar serves the site and the API from one origin. The Dockerfile at the repo root does this automatically.

Every backend endpoint is typed and wrapped in `src/lib/api.ts` (`api.auth.*`, `api.videos`, `api.video`, `api.readback`, `api.translate.preview`, `api.gate.*`, `api.runs.*`, `pollRun`). Payload shapes and the endpoint table are in the root `README.md`.

Design tokens live in `tailwind.config.ts` and `src/index.css`; glass tiers in `src/components/glass.css`.
