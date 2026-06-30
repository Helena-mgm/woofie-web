# Makefile - Woofie Project 🐾

DC = docker compose
EXEC_PHP = $(DC) exec symfony
EXEC_NODE = $(DC) exec nextjs

.PHONY: up down build logs ps bash composer migrate dbshell

## 🐳 Containers
up:
	docker compose down --remove-orphans
	docker compose build --no-cache
	docker compose up -d --wait
	docker compose exec symfony php bin/console doctrine:migrations:migrate --no-interaction || true
	docker compose exec symfony php bin/console cache:clear || true
	@echo "🤖 Téléchargement du modèle Ollama (peut prendre quelques minutes)..."
	@docker compose exec ollama ollama pull llama3.2 || echo "⚠️  Ollama pull échoué, vous pouvez le faire manuellement avec 'make ollama-pull'"
	@echo "✅ Woofie is ready at http://localhost:8000"
	@echo "📊 Adminer: http://localhost:8080"
	@echo "📊 pgAdmin: http://localhost:5050"
	@echo "🤖 WoofieBot: modèle llama3.2 prêt"

down:
	$(DC) down

build:
	$(DC) up -d --build

logs:
	$(DC) logs -f

ps:
	$(DC) ps

## 🧱 Backend (Symfony)
bash:
	$(EXEC_PHP) bash

composer:
	$(EXEC_PHP) composer install

migrate:
	$(EXEC_PHP) php bin/console doctrine:migrations:migrate --no-interaction

dbshell:
	$(DC) exec db psql -U symfony -d woofie

## 🤖 Ollama (AI Chatbot)
ollama-pull:
	@echo "🤖 Téléchargement du modèle Ollama llama3.2..."
	@docker compose exec ollama ollama pull llama3.2
	@echo "✅ Modèle llama3.2 téléchargé et prêt !"

ollama-list:
	@echo "📋 Modèles Ollama disponibles:"
	@docker compose exec ollama ollama list

ollama-bash:
	@docker compose exec ollama sh

## 🗄️ Database Admin
adminer:
	@echo "🌐 Adminer disponible sur: http://localhost:8080"
	@echo "   Serveur: db"
	@echo "   Utilisateur: symfony"
	@echo "   Mot de passe: symfony"
	@echo "   Base de données: woofie"

pgadmin:
	@echo "🌐 pgAdmin disponible sur: http://localhost:5050"
	@echo "   Email: admin@woofie.com"
	@echo "   Mot de passe: admin"
	@echo ""
	@echo "   Lors de la première connexion, ajoutez le serveur:"
	@echo "   - Nom: Woofie DB"
	@echo "   - Host: db"
	@echo "   - Port: 5432"
	@echo "   - Username: symfony"
	@echo "   - Password: symfony"
	@echo "   - Database: woofie"

## ⚡️ Frontend (Next.js)
node-bash:
	$(EXEC_NODE) sh

## 🧹 Utilitaires
restart:
	@echo "🔄 Restarting containers..."
	-@docker compose down -v --remove-orphans
	@docker compose up -d --build

clean:
	$(DC) down -v --remove-orphans
	docker system prune -f

clean-all:
	$(DC) down -v --remove-orphans
	docker system prune -a -f
	docker volume prune -f
	docker network prune -f
	docker builder prune -f

fix-ports:
	@echo "🔧 Libération des ports 3000 et 8000..."
	-@sudo lsof -t -i:8000 -i:3000 | xargs -r sudo kill -9
	@echo "✅ Ports libérés."

reset:
	docker compose down -v
	docker compose build
	docker compose up -d --wait
	make up

## ─────────────────────────────────────────────────────────
## 🚀 Production — https://woofie.ovh
## ─────────────────────────────────────────────────────────
DC_PROD = docker compose -f docker-compose.prod.yaml --env-file .env.prod

prod-deploy:
	@chmod +x deploy.sh && ./deploy.sh

prod-up:
	$(DC_PROD) up -d

prod-down:
	$(DC_PROD) down

prod-build:
	$(DC_PROD) build --no-cache

prod-restart:
	$(DC_PROD) restart

prod-logs:
	$(DC_PROD) logs -f

prod-ps:
	$(DC_PROD) ps

prod-bash:
	$(DC_PROD) exec symfony bash

prod-migrate:
	$(DC_PROD) exec symfony php bin/console doctrine:migrations:migrate --no-interaction

prod-cache-clear:
	$(DC_PROD) exec symfony php bin/console cache:clear --env=prod

prod-dbshell:
	$(DC_PROD) exec db psql -U woofie -d woofie

prod-ollama:
	@echo "🤖 Téléchargement du modèle llama3.2..."
	$(DC_PROD) exec ollama ollama pull llama3.2
	@echo "✅ Modèle prêt !"

prod-update:
	@echo "🔄 Mise à jour de Woofie en production..."
	git pull origin main
	$(DC_PROD) build --no-cache
	$(DC_PROD) up -d --force-recreate
	$(DC_PROD) exec symfony php bin/console doctrine:migrations:migrate --no-interaction || true
	@echo "✅ Mise à jour terminée → https://woofie.ovh"
