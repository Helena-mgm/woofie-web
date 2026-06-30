# === Builder ===
FROM node:20-bullseye AS builder
WORKDIR /app

# Arguments de build (baked into the client bundle at compile time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_ENABLED=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_ENABLED=$NEXT_PUBLIC_WS_ENABLED

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# === Runner (production — Next.js standalone) ===
# next.config.ts → output: 'standalone' génère .next/standalone/server.js
# Ce mode est recommandé en prod : image plus légère, démarrage plus rapide
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone écoute sur PORT / HOSTNAME
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Seuls les fichiers nécessaires à l'exécution
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

EXPOSE 3000
CMD ["node", "server.js"]

