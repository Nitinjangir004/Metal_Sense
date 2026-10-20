# Multi-stage production Dockerfile for MetalSense SaaS
# Stage 1: Build workspace artifacts
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci

# Copy full monorepo source
COPY . .

# Build all packages in topological order
RUN npm run build:shared
RUN npm run build:server
RUN npm run build:client

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Create unprivileged application user
RUN addgroup -S metalsense && adduser -S metalsense -G metalsense

# Copy dependency manifests and install production packages only
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci --omit=dev

# Copy compiled outputs from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory owned by metalsense user
RUN mkdir -p /app/uploads && chown -R metalsense:metalsense /app/uploads

# Switch to non-root user
USER metalsense

EXPOSE 5000

# Health check against deterministic health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "server/dist/index.js"]
