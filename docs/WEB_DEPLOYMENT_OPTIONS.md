# Web Deployment Options

This document analyzes deployment options for the TanStack Start web application, including server requirements and runtime alternatives.

---

## Table of Contents

- [Do You Need a Custom Server?](#do-you-need-a-custom-server)
- [Runtime Options Comparison](#runtime-options-comparison)
- [Recommendation](#recommendation)
- [Running Bun Locally](#running-bun-locally)
- [Bun Dockerfile Example](#bun-dockerfile-example)
- [Sources](#sources)

---

## Do You Need a Custom Server?

**No, the current setup is correct.**

TanStack Start uses **Nitro** under the hood to generate a production-ready server at build time. When you run `pnpm build`, it outputs to `.output/server/index.mjs` — this is a fully functional production server that handles:

- Server-side rendering (SSR)
- Static asset serving
- API routes / server functions
- Routing

The current Dockerfile approach is the standard, recommended method:

```dockerfile
CMD ["node", ".output/server/index.mjs"]
```

### Available Server Options

| Option                      | Description                                    | When to Use                                  |
| --------------------------- | ---------------------------------------------- | -------------------------------------------- |
| **Default Nitro (current)** | Auto-generated Node.js server                  | Most deployments, simple and reliable        |
| **Nitro with preset**       | Target-specific builds (bun, cloudflare, etc.) | Deploying to specific platforms              |
| **Custom Bun server**       | Hand-rolled server using Bun APIs              | Maximum performance, React 19 required       |
| **Custom Express server**   | Embed Start in Express                         | Need middleware, WebSockets, or custom logic |

---

## Runtime Options Comparison

### Option A: Node.js (Current)

**Performance:** ~14,000 requests/sec in SSR benchmarks

**Pros:**

- Battle-tested, 15+ years of production use
- Largest ecosystem (npm compatibility)
- Most stable for enterprise workloads
- Current Dockerfile already works
- Extensive documentation and community support

**Cons:**

- Slower than alternatives
- Cold starts can be slower

**Performance boost:** Use `NITRO_PRESET=node_cluster` to leverage multi-process performance with Node.js cluster module.

### Option B: Bun (Recommended Alternative)

**Performance:** ~68,000 requests/sec in SSR benchmarks (3-4x faster than Node.js)

**Pros:**

- 3-4x faster than Node.js in HTTP handling
- Faster cold starts
- Native TypeScript support
- React 19 compatible (our setup qualifies)
- Built-in bundler and package manager
- Drop-in replacement for most Node.js code

**Cons:**

- Less production-proven than Node.js
- Some npm packages may have compatibility issues
- Smaller community for troubleshooting
- Younger ecosystem (released 2022)

### Option C: Deno

**Performance:** ~29,000 requests/sec (middle ground)

**Pros:**

- Best security by default (permission-based)
- Good for regulated environments
- Built-in TypeScript support
- Modern standard library

**Cons:**

- More friction with npm packages
- Less TanStack Start documentation/examples
- Would require more configuration changes
- Different module resolution system

### Performance Comparison Table

| Runtime | HTTP Requests/sec | Cold Start | npm Compatibility | Production Maturity |
| ------- | ----------------- | ---------- | ----------------- | ------------------- |
| Node.js | ~14,000           | Slower     | Excellent         | Excellent           |
| Bun     | ~68,000           | Fast       | Good              | Moderate            |
| Deno    | ~29,000           | Fast       | Moderate          | Good                |

---

## Recommendation

### For Production (k3s on Hetzner)

1. **Start with Node.js** (current setup) — it's proven and the Dockerfile works correctly.

2. **Consider Bun as a second phase** once the deployment pipeline is validated. The performance gains are real (3-4x faster), and React 19 meets the compatibility requirements.

3. **Skip Deno** unless there are specific security compliance requirements.

### Risk/Reward for Bun Migration

- **Low risk:** React 19 + TanStack Start v1.145 is compatible
- **Medium effort:** Dockerfile change + optional vite preset config
- **High reward:** Significant performance improvement, especially for SSR-heavy workloads

---

## Running Bun Locally

### Prerequisites

Install Bun on your system:

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Homebrew (macOS)
brew install oven-sh/bun/bun

# Windows (via PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify installation:

```bash
bun --version
```

### Method 1: Run Existing Build with Bun

Build the app normally, then run with Bun instead of Node:

```bash
# Build the app (from monorepo root)
pnpm build

# Navigate to web app
cd apps/web

# Run the production server with Bun
bun run .output/server/index.mjs
```

The server will start on `http://localhost:3000` (or the port specified by `PORT` env var).

### Method 2: Use Bun for Development

You can also use Bun to run the development server:

```bash
cd apps/web

# Install dependencies with Bun (optional, pnpm works fine)
bun install

# Run dev server with Bun
bun run dev
```

### Method 3: Full Bun Build with Nitro Preset

For optimal Bun performance, configure Nitro to use the Bun preset:

1. Update `apps/web/app.config.ts`:

```typescript
import { defineConfig } from '@tanstack/react-start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
  server: {
    preset: 'bun', // Add this line
  },
});
```

2. Build and run:

```bash
cd apps/web
bun run build
bun run .output/server/index.mjs
```

### Environment Variables

The server respects these environment variables:

```bash
# Port configuration
PORT=3000

# Or Nitro-specific
NITRO_PORT=3000
NITRO_HOST=0.0.0.0

# For HTTPS (optional)
NITRO_SSL_CERT=/path/to/cert.pem
NITRO_SSL_KEY=/path/to/key.pem
```

### Testing Bun Compatibility

Before committing to Bun, test your app thoroughly:

```bash
cd apps/web

# Build with Bun
bun run build

# Run production server
bun run .output/server/index.mjs

# In another terminal, test endpoints
curl http://localhost:3000
curl http://localhost:3000/api/health  # if you have health endpoints
```

Check for:

- All pages render correctly
- API routes work
- Authentication flows complete
- No console errors
- SSR hydration works properly

---

## Bun Dockerfile Example

If you decide to use Bun in production, here's an updated Dockerfile:

```dockerfile
# ============================================
# Stage 1: Build the web application with Bun
# ============================================
FROM oven/bun:1-alpine AS web-builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build the web application
WORKDIR /app/apps/web
RUN pnpm build

# ============================================
# Stage 2: Production runtime with Bun
# ============================================
FROM oven/bun:1-alpine AS web-runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 webapp

# Copy built application from builder stage
COPY --from=web-builder --chown=webapp:nodejs /app/apps/web/.output ./.output

# Switch to non-root user
USER webapp

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server with Bun
CMD ["bun", "run", ".output/server/index.mjs"]
```

### Key Differences from Node.js Dockerfile

| Aspect          | Node.js                         | Bun                                |
| --------------- | ------------------------------- | ---------------------------------- |
| Base image      | `node:20-alpine`                | `oven/bun:1-alpine`                |
| Runtime command | `node .output/server/index.mjs` | `bun run .output/server/index.mjs` |
| Image size      | ~180MB                          | ~150MB                             |
| Startup time    | ~500ms                          | ~100ms                             |

---

## Hybrid Approach: Build with Node, Run with Bun

You can also build with Node.js (more stable) but run with Bun (faster):

```dockerfile
# Build stage uses Node.js for stability
FROM node:20-alpine AS web-builder
# ... build steps ...

# Runtime stage uses Bun for performance
FROM oven/bun:1-alpine AS web-runner
COPY --from=web-builder /app/apps/web/.output ./.output
CMD ["bun", "run", ".output/server/index.mjs"]
```

This gives you the stability of Node.js tooling during build with Bun's runtime performance.

---

## Sources

- [TanStack Start Hosting Docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Nitro Node.js Deployment](https://nitro.build/deploy/runtimes/node)
- [Nitro Bun Deployment](https://nitro.build/deploy/runtimes/bun)
- [Node.js vs Deno vs Bun Comparison](https://betterstack.com/community/guides/scaling-nodejs/nodejs-vs-deno-vs-bun/)
- [JavaScript Runtime Comparison 2025](https://www.sevensquaretech.com/nodejs-vs-deno-bun-javascript-runtime-comparison/)
- [Bun Installation Guide](https://bun.sh/docs/installation)
- [TanStack Start + Bun Example](https://github.com/TanStack/router/tree/main/examples/react/start-bun)

---

_Last updated: January 2025_
