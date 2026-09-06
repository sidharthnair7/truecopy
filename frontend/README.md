# TrueCopy Website — Scaffold

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the landing page, http://localhost:3000/workspace for the product UI stub.

## What's real vs. mock

- Landing page sections are fully built with placeholder/mock content (screenshots referenced in comments are not included — swap in real assets).
- Hero 3D scene (`components/HeroScene.tsx`) is a working R3F scene with a WebGL-support + reduced-motion fallback (`StaticFallback`). No WebGPU/TSL/Gaussian splats — kept intentionally simple per the build brief.
- `/workspace` uses `MOCK_VIDEOS` and `MOCK_REPORT` constants at the top of `app/workspace/page.tsx` — replace these with real API calls to your TrueCopy backend (video list, gate report per run).
- The Dry Run / Live Run toggle in the workspace is currently local state only — wire it to actually gate whether the backend performs a real `videos.update` call.

## Notes

- Lenis smooth scroll auto-disables when the user has `prefers-reduced-motion` set.
- The GSAP pinned pipeline section (`components/PipelineSection.tsx`) pins the viewport for its scroll duration — test this carefully on mobile, pinned sections are the most common source of janky scroll bugs. Consider swapping to a simpler non-pinned fade-in sequence on small viewports if it causes issues.
- All accent colors and spacing tokens live in `tailwind.config.ts` — change the palette there, not inline.
