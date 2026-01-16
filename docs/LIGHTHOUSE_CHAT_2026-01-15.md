## Lighthouse Performance Analysis (Chat)

Source report: `/Users/tom/Downloads/localhost_3000-20260115T150859.json`  
URL tested: `http://localhost:3000/chat`  
Date: 2026-01-15

### Snapshot Summary

- Performance score: 0.44
- FCP: 0.9s
- LCP: 9.3s
- Speed Index: 2.3s
- TBT: 40ms
- CLS: 1.147
- TTFB: 1.0s
- TTI: 9.3s
- Total transfer size: 8,263 KiB

### High-Impact Findings (from the report)

- LCP is very slow (9.3s) and the LCP element is the chat input placeholder (`div#placeholder`).
- CLS is extremely high (1.147) and layout shifts are dominated by the chat main container (`div._chatMain_qxodm_685`).
- Unused JavaScript is huge (~1.7 MiB estimated savings).
- Total JS payload is very large (~8.3 MiB total transfer).
- Unminified JavaScript (~4.5 MiB savings) and unminified CSS (~84 KiB savings) indicate a dev build.
- Server response time for the main document is slow (1,000 ms TTFB).

### Evidence Highlights

- LCP breakdown: TTFB ~1004 ms, element render delay ~458 ms, LCP element is chat placeholder.
- CLS culprit: chat main container accounts for nearly all layout shift score.
- Unused JS: large waste in `framer-motion`, `react-dom_client` (dev), and a large Vite chunk.
- Total payload: `react-dom_client.js`, `framer-motion.js`, `@supabase/ssr`, `seroval` are among top contributors.

## Proposed Changes (Prioritized)

### 1) Fix LCP (9.3s) on `/chat`

- **Render the LCP element immediately on the server.**
  - Ensure the input and placeholder are rendered in SSR (not behind Suspense or lazy).
  - Avoid showing the placeholder only after hydration; render a stable input shell server-side.
- **Reduce time-to-first-byte (1s).**
  - Add server-side caching for `/chat` (route-level cache or edge cache).
  - Trim server work during SSR (defer non-critical data fetching).
  - Avoid expensive synchronous work before sending HTML.
- **Avoid late style changes for the placeholder.**
  - Remove any CSS that changes the placeholder from `display: none` to `block` after hydration.
  - Avoid JS toggles that cause the placeholder to appear late.

### 2) Eliminate massive layout shift (CLS 1.147)

- **Reserve layout space for chat content.**
  - Ensure the chat list container has a fixed or min-height while data loads.
  - Replace dynamic height changes with skeletons that match final sizes.
- **Stabilize sidebar + header layout.**
  - Prevent layout changes when data or user state arrives (e.g., theme toggle, conversation list).
  - Avoid toggling between hidden and visible states without reserved space.
- **Font and theme stabilization.**
  - Use `font-display: swap` and ensure font metrics are consistent to avoid reflow.
  - Ensure SSR and client theme state match to avoid hydration-related shifts.

### 3) Reduce JS payloads (unused JS + total bytes)

- **Split and lazy-load heavy client dependencies.**
  - Move `framer-motion` usage behind dynamic imports for non-critical animations.
  - Split optional panels (e.g., history, breathing, journaling) into lazy routes.
- **Tree-shake and reduce duplicate imports.**
  - Audit large shared chunks (e.g., `chunk-USRQDQVP.js`) for unused exports.
  - Replace wide imports with per-module imports to improve tree-shaking.
- **Drop dev-only bundles in production.**
  - Ensure production builds use minified `react-dom` and remove Vite dev client.
  - Verify `pnpm build`/`pnpm preview` is used for Lighthouse runs.

### 4) Build in production mode (minify + compress)

- **Minify JS/CSS in production builds.**
  - Vite should produce minified bundles; ensure production build configuration is used.
- **Enable compression (gzip/brotli) on the server.**
  - Helps reduce transfer sizes for large JS payloads.

### 5) Investigate hydration mismatch

- **Resolve server/client mismatch for theme state.**
  - Current console error indicates hydration differences in the ThemeToggle.
  - Align SSR output with client state (store theme in cookie or server-rendered state).
  - This will reduce both layout shift and possible rerenders.

## Suggested Next Steps

1. Re-run Lighthouse against a production build (`pnpm build` + `pnpm preview`) to get realistic numbers.
2. Focus on `/chat` route SSR time and LCP element rendering order.
3. Implement layout stabilization for the chat container to reduce CLS.
4. Add route-level code splitting and lazy-loading for heavy UI modules.
5. Re-measure after changes and compare LCP/CLS + transfer size deltas.
