# Multi-stage Dockerfile for MarketSage Admin Portal
# Production-ready Next.js application with security best practices

FROM node:20-alpine AS base

# Stage 1: Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ curl wget
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with robust networking
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 1 && \
    (npm ci --only=production --ignore-scripts || \
     (echo "Retry 1 after 10s..." && sleep 10 && npm ci --only=production --ignore-scripts) || \
     (echo "Retry 2 after 20s..." && sleep 20 && npm ci --only=production --ignore-scripts) || \
     (echo "Final attempt with clean cache..." && npm cache clean --force && npm ci --only=production --ignore-scripts)) && \
    npm cache clean --force

# Install dev dependencies for build
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_APP_URL
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true

# Build the application
RUN npm run build

# Stage 3: Production Runner
FROM base AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache curl wget bash

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_CONTAINER=true
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

# Create necessary directories with correct ownership
RUN mkdir -p ./public ./node_modules ./.next/cache && \
    chown -R nextjs:nodejs /app

# Copy production files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy essential configuration files
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose admin portal port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

# Stage 4: Development
FROM base AS development
WORKDIR /app

# Install all dependencies including dev dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Expose port for development
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]
