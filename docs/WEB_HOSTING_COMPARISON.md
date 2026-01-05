# Web App Hosting Comparison for TanStack Start

> **Research Date:** January 2025
> **App:** Wbot Web (TanStack Start + React 19)

---

## Executive Summary

| Platform       | TanStack Support | Best For             | Recommendation           |
| -------------- | ---------------- | -------------------- | ------------------------ |
| **Netlify**    | Official Partner | Simplicity, JAMstack | **Recommended**          |
| **Cloudflare** | Official Partner | Performance, Cost    | Strong Alternative       |
| **Vercel**     | Supported        | Next.js apps         | Viable but not optimized |

**Recommendation:** **Netlify** - Official TanStack partner with dedicated plugin, best DX, and strong free tier.

---

## TanStack Start Integration

### Official Hosting Partners

TanStack explicitly recommends **Cloudflare** and **Netlify** as their official hosting partners.

### Netlify (Best Integration)

```bash
# Install the official plugin
pnpm add @netlify/vite-plugin-tanstack-start
```

```ts
// vite.config.ts
import { tanstackStart } from '@netlify/vite-plugin-tanstack-start';

export default {
  plugins: [tanstackStart()],
};
```

**Features:**

- Full production platform emulation in local dev
- SSR, Server Routes, Server Functions, middleware all supported
- Zero-config deployment (just push to repo)
- [Netlify became official TanStack deployment host (March 2025)](https://devclass.com/2025/03/21/netlify-becomes-official-deployment-host-for-tanstack-as-alternative-to-next-js-and-vendor-lock-in/)

### Cloudflare Pages

```ts
// app.config.ts
import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    preset: 'cloudflare-pages',
  },
});
```

**Features:**

- Full Cloudflare Developer Platform integration (Workers, KV, D1, R2)
- Requires @tanstack/react-start v1.138.0+
- [Official Cloudflare docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)

### Vercel

```ts
// app.config.ts
import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    preset: 'vercel',
  },
});
```

**Features:**

- GitHub integration, server functions, edge functions work out of box
- Not an official partner (optimized for Next.js)
- [Vercel TanStack Start docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)

---

## Pricing Comparison

### Free Tier

| Feature                    | Netlify        | Cloudflare | Vercel    |
| -------------------------- | -------------- | ---------- | --------- |
| **Bandwidth**              | 100 GB/mo      | Unlimited  | 100 GB/mo |
| **Serverless Invocations** | 125K/site/mo   | 100K/day   | 100K/mo   |
| **Edge Functions**         | 1M requests/mo | Included   | Limited   |
| **Build Minutes**          | 300/mo         | 500/mo     | 6000/mo   |
| **Sites/Projects**         | Unlimited      | Unlimited  | Unlimited |

### Paid Plans

| Plan                  | Netlify        | Cloudflare    | Vercel        |
| --------------------- | -------------- | ------------- | ------------- |
| **Starter**           | $19/member/mo  | $5/mo flat    | $20/member/mo |
| **Team/Pro**          | $25/mo + usage | $5/mo + usage | $20/member/mo |
| **Bandwidth overage** | $55/100GB      | $0.15/GB      | $40/100GB     |

**Cost Efficiency Ranking:** Cloudflare > Netlify > Vercel

---

## Performance

### Edge Network

| Platform       | Edge Locations | Cold Start         | Best For           |
| -------------- | -------------- | ------------------ | ------------------ |
| **Cloudflare** | 300+           | ~0ms (V8 isolates) | Global low-latency |
| **Vercel**     | 100+           | ~50-200ms          | Dynamic content    |
| **Netlify**    | 100+           | ~100-300ms         | Static + light SSR |

### Real-World Performance

- **Cloudflare**: Fastest edge execution, V8 isolates eliminate cold starts
- **Vercel**: Excellent for SSR, cold starts on free tier
- **Netlify**: Great for static, solid for SSR

**Performance Ranking:** Cloudflare > Vercel > Netlify (for edge/SSR)

---

## Observability & Monitoring

### Netlify Observability (December 2025)

| Feature                                            | Free     | Pro    |
| -------------------------------------------------- | -------- | ------ |
| Request metrics (path, region, status, latency)    | ✅       | ✅     |
| Function execution (duration, cold starts, errors) | ✅       | ✅     |
| Bandwidth & usage signals                          | ✅       | ✅     |
| Web Analytics (GDPR-compliant)                     | ✅       | ✅     |
| Log retention                                      | 24 hours | 7 days |
| Log drains (external)                              | ✅       | ✅     |

[Netlify Observability Docs](https://docs.netlify.com/manage/monitoring/observability/overview/)

### Cloudflare Workers Observability

| Feature                      | Free    | Paid      |
| ---------------------------- | ------- | --------- |
| Workers Logs                 | ✅      | ✅        |
| Query Builder & Dashboard    | ✅      | ✅        |
| Automatic Tracing (Oct 2025) | ✅      | ✅        |
| CPU/Wall time metrics        | ✅      | ✅        |
| Analytics Engine (custom)    | Limited | Unlimited |

[Cloudflare Workers Observability](https://blog.cloudflare.com/introducing-workers-observability-logs-metrics-and-queries-all-in-one-place/)

### Vercel Observability

| Feature                          | Free        | Pro        | Observability Plus |
| -------------------------------- | ----------- | ---------- | ------------------ |
| Runtime logs                     | ✅ (1 hour) | ✅ (1 day) | ✅ (30 days)       |
| Web Analytics                    | ✅          | ✅         | ✅                 |
| Speed Insights                   | ✅          | ✅         | ✅                 |
| Drains (export to Datadog, etc.) | ❌          | ✅         | ✅                 |
| OpenTelemetry traces             | ❌          | ✅         | ✅                 |

[Vercel Observability](https://vercel.com/products/observability)

**Observability Ranking:** Cloudflare ≈ Vercel > Netlify (but all sufficient)

---

## Developer Experience

### Netlify

**Pros:**

- Official TanStack plugin with local dev emulation
- Instant rollbacks
- Branch deploys & preview URLs
- Form handling built-in
- Split testing built-in

**Cons:**

- Build minutes can run out on free tier
- Less edge compute focus than Cloudflare

### Cloudflare

**Pros:**

- Fastest edge performance
- Cheapest at scale
- Access to full Cloudflare platform (KV, D1, R2, AI)
- Wrangler CLI is excellent

**Cons:**

- Not Node.js runtime (V8 Workers)
- Some npm packages don't work
- Steeper learning curve

### Vercel

**Pros:**

- Best-in-class DX for Next.js
- Excellent preview deployments
- Strong GitHub integration
- Good analytics

**Cons:**

- Not a TanStack official partner
- More expensive at scale
- Optimized for their framework (Next.js)

---

## Wbot-Specific Considerations

### Your Stack

- **Framework:** TanStack Start (React 19)
- **Auth:** Supabase
- **API:** Self-hosted LangGraph (port 8123)
- **Realtime:** LangGraph streaming

### Key Requirements

| Requirement           | Netlify | Cloudflare | Vercel |
| --------------------- | ------- | ---------- | ------ |
| SSR support           | ✅      | ✅         | ✅     |
| Streaming responses   | ✅      | ✅         | ✅     |
| Supabase integration  | ✅      | ✅         | ✅     |
| Custom API backend    | ✅      | ✅         | ✅     |
| CORS configuration    | Easy    | Easy       | Easy   |
| Environment variables | ✅      | ✅         | ✅     |

All three platforms can connect to your self-hosted LangGraph backend.

---

## Final Recommendation

### For Wbot: **Netlify**

**Why:**

1. **Official TanStack Partner** - First-class support, dedicated plugin
2. **Simple Setup** - `@netlify/vite-plugin-tanstack-start` handles everything
3. **Good Free Tier** - 100GB bandwidth, 125K function calls
4. **Observability Included** - New features released Dec 2025
5. **No Vendor Lock-in** - Explicit TanStack partnership goal

### Runner-up: **Cloudflare Pages**

Choose Cloudflare if:

- You need absolute lowest latency globally
- Cost is critical at scale
- You want access to Workers KV, D1, R2 for future features

### When to use Vercel

- You're migrating from Next.js
- You need their specific enterprise features
- Team is already using Vercel for other projects

---

## Quick Start (Netlify)

```bash
# 1. Install plugin
pnpm add -D @netlify/vite-plugin-tanstack-start

# 2. Update vite.config.ts
# (see integration section above)

# 3. Deploy
netlify deploy --prod

# Or connect GitHub repo for auto-deploys
```

---

## Sources

- [TanStack Start Hosting Guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Netlify TanStack Start Docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/)
- [Cloudflare TanStack Start Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [Vercel vs Netlify vs Cloudflare 2025 Comparison](https://www.digitalapplied.com/blog/vercel-vs-netlify-vs-cloudflare-pages-comparison)
- [Why TanStack Start is Ditching Adapters](https://tanstack.com/blog/why-tanstack-start-is-ditching-adapters)
- [Netlify Becomes Official TanStack Host](https://devclass.com/2025/03/21/netlify-becomes-official-deployment-host-for-tanstack-as-alternative-to-next-js-and-vendor-lock-in/)
