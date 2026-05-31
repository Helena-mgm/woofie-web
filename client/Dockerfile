# === Builder ===
FROM node:20-bullseye AS builder
WORKDIR /app

# Argument pour l'URL de l'API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# === Runner ===
FROM node:20-bullseye AS runner
WORKDIR /app

# Copie les fichiers nécessaires au run
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]

