# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# ❌ 빌더에서는 NODE_ENV=production 설정하지 마세요
ENV NUXT_TELEMETRY_DISABLED=1

COPY package*.json ./
# devDependencies까지 설치
RUN npm ci --include=dev

# 소스 복사 & 빌드
COPY . .
RUN npm run build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# 런타임에서만 production
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000
ENV NUXT_PUBLIC_API_BASE=/llama

COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
