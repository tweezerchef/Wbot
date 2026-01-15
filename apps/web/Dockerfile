# ============================================================================
# Wbot Web Frontend - TanStack Start Production Build
# ============================================================================
# Multi-stage build for optimized production image
# ============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# Build-time env (client-side Vite vars)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_LANGGRAPH_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_LANGGRAPH_API_URL=$VITE_LANGGRAPH_API_URL

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages (needed for monorepo build)
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies (cache pnpm store between builds)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/web
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the Nitro output (self-contained production server)
# Nitro bundles everything needed for the server
COPY --from=builder /app/apps/web/.output /app/.output

# Install production dependencies for Nitro server output
WORKDIR /app/.output/server
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prod --no-lockfile

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Health check - check root path since TanStack Start serves the app there
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Nitro production server
CMD ["node", "index.mjs"]
