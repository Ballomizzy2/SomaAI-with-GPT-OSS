# Soma AI Next.js wrapper

Thin Next.js app that embeds the Unity WebGL export found at
`../Builds/SoraAI_HTML/index.html`.

## Getting started

1) From the repo root, install dependencies:
```bash
cd soma-next
npm install
```

2) Run locally:
```bash
npm run dev
```
Then open http://localhost:3000/ to see the embedded player. The "Open full
window" button links directly to the served Unity index.

## How it works

- The Unity build remains in `Builds/SoraAI_HTML`. No copying is required.
- Requests to `/unity/...` are handled by `app/unity/[[...path]]/route.ts`,
  which streams files from the Unity export folder and preserves brotli
  encoding for `.br` assets.
- The landing page in `app/page.tsx` renders an iframe pointed at `/unity` so
  the WebGL build loads in place while still being reachable directly.



