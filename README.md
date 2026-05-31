# 🐶 Woofie - Le Réseau Social des Toutous# Woofie — Dog owners social app



> Plateforme sociale pour propriétaires de chiens et dog-sittersThis repository contains a Next.js frontend (`client/`) and a Symfony backend (`server/`).



## 🚀 Quick StartQuick start (dev):



```bash1. Backend

# Lancer l'application

docker-compose up -d- cd server

- composer install

# Accéder à l'app- copy `.env` from project's template (if present) or create `.env.local` with DB config and JWT_SECRET

open http://localhost:8000- configure DATABASE_URL (sqlite recommended for dev) e.g. `DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"`

```- run migrations: `php bin/console doctrine:migrations:diff` then `php bin/console doctrine:migrations:migrate`

- run server: `symfony server:start --port=8000` or `php -S 127.0.0.1:8000 -t public`

## 📘 Documentation

2. Frontend

**[→ Voir DEV_DOCS.md](./DEV_DOCS.md)** - Documentation complète pour développeurs

- cd client

## 🏗️ Stack- npm install

- set `NEXT_PUBLIC_API_BASE` env var to `http://localhost:8000`

- **Frontend:** Next.js 15.5.4 + React 19 + TypeScript + TailwindCSS- npm run dev

- **Backend:** Symfony 7.3 + Doctrine + JWT

- **Database:** PostgreSQLAPI endpoints implemented:

- **Containers:** Docker + Docker Compose

- POST /api/register { email, password, type: 'owner'|'sitter' }

## 📂 Structure- POST /api/login { email, password } -> returns { token }



```Notes: This is an initial skeleton. In production, use a proper JWT authentication bundle, HTTPS, and secure secrets.

client/     # Frontend Next.js
server/     # Backend Symfony API
nginx/      # Reverse proxy
```

## 🔧 Dev

```bash
# Frontend
cd client && npm install && npm run dev

# Backend
cd server && composer install

# Database migrations
docker-compose exec server php bin/console doctrine:migrations:migrate
```

---

