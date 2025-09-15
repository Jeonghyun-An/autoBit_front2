# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Nuxt 텔레메트리/CI 노이즈 제거
ENV NUXT_TELEMETRY_DISABLED=1
ENV CI=true
# 여기선 NODE_ENV=production 설정하지 않음 (devDeps 필요)

# lockfile 포함해서 먼저 복사 → 캐시 최대화
COPY package.json package-lock.json ./
# devDependencies 포함해서 설치 (기본값이 dev 포함이므로 플래그 불필요)
RUN npm ci

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

# Nuxt 빌드 결과만 복사 (node_modules 불필요)
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
