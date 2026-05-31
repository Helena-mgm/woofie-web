# 🐶 Woofie — The Social Network for Dogs

> A social platform for dog owners and professional dog-sitters.  
> Share moments, find a trusted sitter, and get dog care advice from our built-in AI assistant.

[![CI — Woofie](https://github.com/Helena-mgm/woofie-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Helena-mgm/woofie-web/actions/workflows/ci.yml)

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Getting Started in 3 Minutes](#-getting-started-in-3-minutes)
- [Accessing the App](#-accessing-the-app)
- [Database Access](#-database-access)
- [Test Accounts](#-test-accounts)
- [Useful Commands](#-useful-commands)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## ✅ Prerequisites

Before you begin, make sure the following tools are installed on your machine:

| Tool | Recommended version | Check command |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | `docker --version` |
| [Docker Compose](https://docs.docker.com/compose/) | 2.20+ | `docker compose version` |
| [Git](https://git-scm.com/) | 2.30+ | `git --version` |
| [Make](https://formulae.brew.sh/formula/make) | Any | `make --version` |

> **macOS**: Docker Desktop already includes Docker Compose. For `make`, run `brew install make`.  
> **Windows**: Use [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) + Docker Desktop.

---

## 🚀 Getting Started in 3 Minutes

### 1. Clone the repository

```bash
git clone https://github.com/Helena-mgm/woofie-web.git
cd woofie-web
```

### 2. Set up environment variables

The backend `server/.env` file is **already configured** for Docker. No changes are needed for a standard local setup.

If you want to customise values (JWT secret, DB port, etc.):

```bash
cp server/.env.local.example server/.env.local
# Then edit server/.env.local with your own values
```

### 3. Start all services

```bash
make up
```

This single command will automatically:

1. 🏗️  Build all Docker images (backend, frontend, nginx...)
2. ▶️  Start all 6 containers (DB, API, frontend, proxy, AI, DB admin)
3. 🗄️  Run all database migrations
4. 🤖  Download the **llama3.2** AI model for WoofieBot *(may take 2–5 min on first run)*
5. ✅  Print all access URLs

> ⏳ **On first launch**, downloading Docker images and the AI model can take **5 to 10 minutes** depending on your connection. Subsequent starts will be near-instant.

---

## 🌐 Accessing the App

Once `make up` finishes, open your browser:

| Service | URL | Description |
|---|---|---|
| 🐶 **Woofie App** | http://localhost:8000 | Main application |
| 🔧 **Adminer** (DB) | http://localhost:8080 | Lightweight database explorer |
| 📊 **pgAdmin** (DB) | http://localhost:5050 | Advanced PostgreSQL interface |

---

## � Database Access

### Via Adminer (http://localhost:8080)

| Field | Value |
|---|---|
| System | PostgreSQL |
| Server | `db` |
| Username | `symfony` |
| Password | `symfony` |
| Database | `woofie` |

### Via pgAdmin (http://localhost:5050)

Login: `admin@woofie.com` / `admin`

On first login, click **"Add New Server"** and fill in:
- **Name**: `Woofie DB`
- **Host**: `db`
- **Port**: `5432`
- **Username**: `symfony`
- **Password**: `symfony`

---

## 🧪 Test Accounts

Create an account directly from the interface by clicking **"Sign Up"**.  
Two account types are available:

- 👤 **Dog Owner**: manages their profile and dogs (ICAD chip/tattoo number validation)
- 🧑‍💼 **Professional Dog-Sitter**: manages their profile with SIRET business number validation (INSEE API)

---

## 🛠️ Useful Commands

```bash
# Start the full project (build + migrations + AI model)
make up

# Stop all containers
make down

# Follow live logs from all services
make logs

# Check the status of all containers
make ps

# Open a shell inside the PHP/Symfony backend container
make bash

# Run database migrations manually
make migrate

# Open a PostgreSQL shell directly
make dbshell

# Manually download the AI model (if make up failed on that step)
make ollama-pull

# List available AI models in Ollama
make ollama-list

# Free up ports 3000 and 8000 if already in use
make fix-ports

# Wipe everything and start fresh (containers + volumes + images)
make clean-all && make up
```

---

## 📦 Tech Stack

### Frontend

| Technology | Role |
|---|---|
| Next.js 15 (React 19) | Hybrid SPA framework (SSR + Client-side) |
| TypeScript | Static typing |
| TailwindCSS | Utility-first styling |
| Leaflet + OpenStreetMap | Interactive map for dog-friendly POIs |

### Backend

| Technology | Role |
|---|---|
| Symfony 7.3 (PHP 8.2) | REST API |
| Doctrine ORM | Database abstraction & migrations |
| Firebase JWT | Stateless authentication |
| Ollama + Llama 3.2 | Local conversational AI (WoofieBot) |
| INSEE Sirene API | Legal SIRET business number validation |
| Overpass API (OSM) | Geographic points of interest import |

### Infrastructure

| Technology | Role |
|---|---|
| Docker + Docker Compose | Full service containerisation |
| Nginx | Reverse proxy (routes `/` → Next.js, `/api/` → Symfony) |
| PostgreSQL 15 | Relational database |

---

## 📂 Project Structure

```
woofie-web/
│
├── client/                  # Next.js 15 frontend
│   ├── src/app/             # Pages (Next.js App Router)
│   ├── src/features/        # Feature modules (forum, messages, map, sitters...)
│   ├── src/presentation/    # Reusable UI components (Header, Footer, forms...)
│   ├── src/shared/          # TypeScript types, utilities, API lib
│   └── Dockerfile
│
├── server/                  # Symfony 7.3 backend
│   ├── src/Controller/      # REST API entry points (12 controllers)
│   ├── src/Entity/          # Doctrine ORM data models (16 entities)
│   ├── src/Service/         # Business logic (SiretValidator, OllamaService, OverpassImporter)
│   ├── src/Repository/      # Database queries
│   ├── src/EventSubscriber/ # CORS, JWT auth, bot conversation listeners
│   ├── migrations/          # SQL migration history (11 versions)
│   ├── .env                 # Docker environment variables (do not edit)
│   ├── .env.local.example   # Template for local customisation
│   └── Dockerfile
│
├── nginx/                   # Reverse proxy configuration
│   └── nginx.conf           # Routing: / → Next.js, /api/ → Symfony
│
├── docker-compose.yaml      # Orchestration of all 6 Docker services
├── Makefile                 # Command shortcuts
└── README.md
```

---

## ❓ Troubleshooting

### ❌ `Port 8000 already in use`

```bash
make fix-ports
make up
```

### ❌ Migrations fail on startup

The database container sometimes needs a few seconds to be ready. Simply re-run:

```bash
make migrate
```

### ❌ WoofieBot doesn't respond

The AI model needs to be downloaded inside the Ollama container:

```bash
make ollama-pull
```

> The **llama3.2** model is approximately **2 GB**. Make sure you have enough disk space and a stable connection.

### ❌ App shows a blank page or error

Check that all containers are running:

```bash
make ps
make logs
```

### ❌ I want to wipe everything and start fresh

```bash
make clean-all
make up
```

> ⚠️ This command **deletes all database data** and rebuilds everything from scratch.

### ❌ `docker compose` command not found (older Docker version)

Update [Docker Desktop](https://www.docker.com/products/docker-desktop/), or replace `docker compose` with `docker-compose` (with a hyphen) in the Makefile.

---

## 🧪 Politique de tests

### Outils utilisés

| Outil | Rôle |
|---|---|
| **PHPUnit 11** | Tests unitaires et fonctionnels Symfony |
| **Symfony WebTestCase** | Simulation de requêtes HTTP sans serveur externe |
| **ESLint + TypeScript** (`tsc --noEmit`) | Analyse statique du frontend |
| **GitHub Actions** | Exécution automatique à chaque push |

### Structure des tests

```
server/tests/
├── Unit/
│   ├── SiretValidatorTest.php   # 7 tests — validation format + algorithme Luhn + injections
│   └── UserEntityTest.php       # 7 tests — rôles, email, hachage Bcrypt, eraseCredentials
└── Functional/
    └── AuthEndpointTest.php     # 6 tests — endpoints /api/login et /api/register (HTTP réel)
```

### Lancer les tests localement

```bash
# Ouvrir un shell dans le conteneur backend
make bash

# Lancer tous les tests avec affichage détaillé
php bin/phpunit --testdox
```

Exemple de sortie attendue :

```
SiretValidator (App\Tests\Unit\SiretValidator)
 ✔ Valid format accepts 14 digits
 ✔ Invalid format rejects too short
 ✔ Invalid format rejects too long
 ✔ Invalid format rejects letters
 ✔ Luhn accepts valid siret
 ✔ Luhn rejects invalid check digit
 ✔ Format rejects special characters

UserEntity (App\Tests\Unit\UserEntity)
 ✔ Get roles always contains role user
 ✔ Get roles returns unique values
 ✔ Set and get email
 ✔ Password is hashed and not stored in clear text
 ✔ Erase credentials does not throw

AuthEndpoint (App\Tests\Functional\AuthEndpoint)
 ✔ Login with missing fields returns 400
 ✔ Login with wrong credentials returns 401
 ✔ Register with empty body returns 400
 ✔ Register with invalid type returns 400
 ✔ Register with short password returns 400
 ✔ Protected route without token returns 401
 ✔ Request with fake jwt token is rejected

OK (20 tests, 25 assertions)
```

### Couverture fonctionnelle

| Domaine | Type | Statut |
|---|---|---|
| Validation SIRET (format + Luhn) | Unitaire | ✅ |
| Hachage Bcrypt du mot de passe | Unitaire | ✅ |
| Rôles et identité utilisateur | Unitaire | ✅ |
| Endpoint `POST /api/login` — champs manquants | Fonctionnel | ✅ |
| Endpoint `POST /api/login` — mauvais identifiants | Fonctionnel | ✅ |
| Endpoint `POST /api/register` — type invalide | Fonctionnel | ✅ |
| Endpoint `POST /api/register` — mot de passe trop court | Fonctionnel | ✅ |
| Route protégée sans token JWT | Fonctionnel | ✅ |
| Token JWT forgé (signature invalide) | Fonctionnel | ✅ |
| Lint TypeScript (0 erreurs) | Analyse statique | ✅ |
| ESLint Next.js | Analyse statique | ✅ |

---

## ⚙️ Intégration Continue (CI)

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) s'exécute **à chaque push** sur `main` ou `develop`, et à chaque Pull Request.

### Jobs du pipeline

| Job | Ce qu'il fait |
|---|---|
| 🐘 **backend-tests** | Lance PHP 8.2 + PostgreSQL 15, installe les dépendances, exécute les migrations de test, puis `php bin/phpunit --testdox` |
| ⚛️ **frontend-lint** | Installe Node 20, exécute `npm run lint` (ESLint) et `tsc --noEmit` (TypeScript) |
| 🐳 **docker-build** | Valide la syntaxe du `docker-compose.yaml` et build les images backend et frontend |

Le badge en haut de ce README reflète l'état du dernier run sur `main`.

---

## 🔒 Sécurité

### Injections SQL
Toutes les requêtes passent par **Doctrine ORM** (DQL paramétré). Aucune concaténation de chaîne directe dans les requêtes SQL. Les rares requêtes natives utilisent `createNativeQuery` avec des paramètres typés.

### XSS
- **Backend** : toutes les réponses sont en JSON — aucun rendu HTML côté serveur hors Twig (utilisé uniquement pour l'email). Twig échappe les variables par défaut.
- **Frontend** : React échappe automatiquement les contenus rendus. Aucun `dangerouslySetInnerHTML` non maîtrisé dans le code.

### CSRF
L'API est **stateless JWT** (pas de sessions, pas de cookies d'authentification). Le vecteur CSRF classique ne s'applique pas. Les requêtes cross-origin sont contrôlées par la configuration CORS dans `EventSubscriber/CorsSubscriber`.

### Hachage des mots de passe
Les mots de passe sont hachés avec **Bcrypt** via le composant `symfony/password-hasher`. Le mot de passe en clair n'est jamais persisté ni loggé.

### Authentification JWT
- Tokens signés avec `HS256` + secret en variable d'environnement (`JWT_SECRET`)
- Expiration des tokens : 24h
- Le `JwtAuthenticator` rejette tout token avec une signature invalide ou un payload malformé
- Les routes sensibles sont protégées par `#[IsGranted]` ou la configuration `security.yaml`

### Validation des entrées
Chaque entité Doctrine utilise les **contraintes Symfony Validator** (`@Assert\NotBlank`, `@Assert\Email`, `@Assert\Choice`…). Les données invalides sont rejetées avec un code 400 avant toute persistance.

### Contrôle d'accès (RBAC)
Deux rôles : `ROLE_USER` (tous les utilisateurs authentifiés) et séparation métier `owner` / `sitter`. Un utilisateur ne peut modifier que ses propres ressources (vérification `$user->getId() === $requestedId`).

### RGPD
- Suppression de compte : l'utilisateur peut supprimer son compte depuis son profil → suppression en cascade de toutes ses données (Doctrine `cascade: ['remove']`)
- Page de politique de confidentialité disponible à `/privacy`
- Aucune donnée sensible dans les logs (les tokens sont tronqués dans les `error_log`)
- Les uploads (photos) sont stockés dans `/public/uploads` hors du versioning

### En-têtes HTTP
- `X-Frame-Options: DENY` et `X-Content-Type-Options: nosniff` configurés via Nginx
- CORS restreint aux origines autorisées en production

---

## 📄 License

Project built as part of the **IPSSI** curriculum.

---

## ✅ Prérequis

Avant de commencer, vous devez avoir installé sur votre machine :

| Outil | Version recommandée | Vérification |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | `docker --version` |
| [Docker Compose](https://docs.docker.com/compose/) | 2.20+ | `docker compose version` |
| [Git](https://git-scm.com/) | 2.30+ | `git --version` |
| [Make](https://formulae.brew.sh/formula/make) | Toute version | `make --version` |

> **macOS** : Docker Desktop inclut déjà Docker Compose. Pour `make`, exécutez `brew install make`.  
> **Windows** : Utilisez [WSL2](https://learn.microsoft.com/fr-fr/windows/wsl/install) + Docker Desktop.

---

## 🚀 Lancer le projet en 3 minutes

### 1. Cloner le dépôt

```bash
git clone https://github.com/Helena-mgm/woofie-web.git
cd woofie-web
```

### 2. Configurer les variables d'environnement

Le fichier `.env` du backend est **déjà configuré** pour Docker. Aucune modification n'est nécessaire pour un lancement local. Si vous souhaitez personnaliser (clé JWT, port BDD...) :

```bash
cp server/.env.local.example server/.env.local
# Puis éditez server/.env.local avec vos propres valeurs
```

### 3. Lancer tous les services

```bash
make up
```

Cette commande va automatiquement :
1. 🏗️  Construire toutes les images Docker (backend, frontend, nginx...)
2. ▶️  Démarrer les 6 conteneurs (BDD, API, frontend, proxy, IA, admin BDD)
3. 🗄️  Appliquer toutes les migrations de base de données
4. 🤖  Télécharger le modèle d'IA **llama3.2** pour WoofieBot *(peut prendre 2-5 min à la première fois)*
5. ✅  Afficher les URLs d'accès

> ⏳ **La première fois**, le téléchargement des images et du modèle IA peut prendre **5 à 10 minutes** selon votre connexion. Les lancements suivants seront quasi-instantanés.

---

## 🌐 Accéder à l'application

Une fois `make up` terminé, ouvrez votre navigateur :

| Service | URL | Description |
|---|---|---|
| 🐶 **Application Woofie** | http://localhost:8000 | L'interface principale |
| 🔧 **Adminer** (BDD) | http://localhost:8080 | Interface légère pour explorer la base de données |
| 📊 **pgAdmin** (BDD) | http://localhost:5050 | Interface avancée PostgreSQL |

---

## 🔑 Accès à la base de données

### Via Adminer (http://localhost:8080)
| Champ | Valeur |
|---|---|
| Système | PostgreSQL |
| Serveur | `db` |
| Utilisateur | `symfony` |
| Mot de passe | `symfony` |
| Base de données | `woofie` |

### Via pgAdmin (http://localhost:5050)
Connexion : `admin@woofie.com` / `admin`  
Lors de la première connexion, cliquez sur **"Add New Server"** et renseignez :
- **Name** : `Woofie DB`
- **Host** : `db`
- **Port** : `5432`
- **Username** : `symfony`
- **Password** : `symfony`

---

## 🧪 Comptes de test

Créez un compte directement depuis l'interface en cliquant sur **"S'inscrire"**.  
Deux types de comptes sont disponibles :

- 👤 **Propriétaire de chien** : gère son profil et ses chiens (validation ICAD)
- 🧑‍💼 **Dog-sitter professionnel** : gère son profil avec validation SIRET

---

## 🛠️ Commandes utiles

```bash
# Démarrer le projet (build + migrate + IA)
make up

# Arrêter tous les conteneurs
make down

# Voir les logs en temps réel
make logs

# Voir l'état des conteneurs
make ps

# Ouvrir un terminal dans le backend PHP
make bash

# Lancer les migrations manuellement
make migrate

# Ouvrir un shell PostgreSQL directement
make dbshell

# Télécharger le modèle IA manuellement (si make up a échoué sur cette étape)
make ollama-pull

# Voir les modèles IA disponibles dans Ollama
make ollama-list

# Tout supprimer et recommencer (conteneurs + volumes + images)
make clean-all && make up

# Libérer les ports 3000 et 8000 si bloqués
make fix-ports
```

---

## 📦 Stack technique

### Frontend
| Technologie | Rôle |
|---|---|
| Next.js 15 (React 19) | Framework SPA hybride (SSR + Client) |
| TypeScript | Typage statique |
| TailwindCSS | Styles utilitaires |
| Leaflet + OpenStreetMap | Carte interactive |

### Backend
| Technologie | Rôle |
|---|---|
| Symfony 7.3 (PHP 8.2) | API REST |
| Doctrine ORM | Abstraction base de données |
| Firebase JWT | Authentification stateless |
| Ollama + Llama 3.2 | IA conversationnelle locale (WoofieBot) |
| API INSEE Sirene | Validation légale des numéros SIRET |
| Overpass API (OSM) | Import des points d'intérêt géographiques |

### Infrastructure
| Technologie | Rôle |
|---|---|
| Docker + Docker Compose | Conteneurisation de tous les services |
| Nginx | Reverse proxy (routage front/back) |
| PostgreSQL 15 | Base de données relationnelle |

---

## 📂 Structure du projet

```
woofie-web/
│
├── client/                  # Frontend Next.js 15
│   ├── src/app/             # Pages (App Router Next.js)
│   ├── src/features/        # Modules fonctionnels (forum, messages, carte, sitters...)
│   ├── src/presentation/    # Composants UI réutilisables (Header, Footer, forms...)
│   ├── src/shared/          # Types TypeScript, utilitaires, lib API
│   └── Dockerfile
│
├── server/                  # Backend Symfony 7.3
│   ├── src/Controller/      # Points d'entrée API REST (12 controllers)
│   ├── src/Entity/          # Modèles de données Doctrine ORM (16 entités)
│   ├── src/Service/         # Logique métier (SiretValidator, OllamaService, OverpassImporter)
│   ├── src/Repository/      # Requêtes base de données
│   ├── src/EventSubscriber/ # CORS, JWT auth, bot conversations
│   ├── migrations/          # Historique des migrations SQL (11 versions)
│   ├── .env                 # Variables d'environnement Docker (ne pas modifier)
│   ├── .env.local.example   # Template pour personnalisation locale
│   └── Dockerfile
│
├── nginx/                   # Configuration du reverse proxy
│   └── nginx.conf           # Routage : / → Next.js, /api/ → Symfony
│
├── docker-compose.yaml      # Orchestration des 6 services Docker
├── Makefile                 # Raccourcis de commandes
└── README.md
```

---

## ❓ Problèmes fréquents

### ❌ `Port 8000 already in use`
```bash
make fix-ports
make up
```

### ❌ Les migrations échouent au démarrage
La base de données met parfois quelques secondes à démarrer. Relancez simplement :
```bash
make migrate
```

### ❌ WoofieBot ne répond pas
Le modèle IA doit être téléchargé dans le conteneur Ollama. Lancez :
```bash
make ollama-pull
```
> Le modèle **llama3.2** pèse environ **2 Go**. Assurez-vous d'avoir suffisamment d'espace disque et une bonne connexion.

### ❌ L'application affiche une erreur ou page blanche
Vérifiez que tous les conteneurs sont bien démarrés :
```bash
make ps
make logs
```

### ❌ Tout est cassé, je veux repartir de zéro
```bash
make clean-all
make up
```
> ⚠️ Cette commande **supprime toutes les données** de la base de données.

### ❌ `docker compose` non reconnu (ancienne version de Docker)
Mettez à jour [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou remplacez `docker compose` par `docker-compose` (avec tiret) dans le Makefile.

---

## 📄 Licence
Ò
Projet réalisé dans le cadre d'un cursus **IPSSI**.
