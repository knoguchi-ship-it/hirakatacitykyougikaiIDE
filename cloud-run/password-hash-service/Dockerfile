# v373.5 design: Cloud Run Argon2id password hash service
# Multi-stage build for minimal final image
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
WORKDIR /app
# argon2 native module needs libstdc++ at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
# Cloud Run sets PORT env automatically
ENV NODE_ENV=production
ENV PORT=8080
USER node
EXPOSE 8080
CMD ["node", "src/index.js"]
