DC = docker compose
EXEC_PHP = $(DC) exec symfony
EXEC_NODE = $(DC) exec nextjs

.PHONY: up down build logs ps bash composer migrate dbshell ollama-pull ollama-list

up: check-env
	docker compose down --remove-orphans
	docker compose build --no-cache
	docker compose up -d --wait
	docker compose exec symfony php bin/console doctrine:migrations:migrate --no-interaction
	docker compose exec symfony php bin/console cache:clear
	@echo "🤖 Téléchargement du modèle Ollama (peut prendre quelques minutes)..."
	@docker compose exec ollama sh -c 'ollama pull "$$OLLAMA_MODEL"' || echo "⚠️  Ollama pull échoué, vous pouvez le faire manuellement avec 'make ollama-pull'"
	@echo "✅ Woofie is ready at http://localhost:8000"
	@echo "📊 Adminer: http://localhost:8080"
	@echo "📊 pgAdmin: http://localhost:5050"
	@echo "🤖 WoofieBot est prêt"

check-env:
	@test -f .env || (echo "Copiez .env.example vers .env puis remplacez les valeurs CHANGE_ME." && exit 1)

down:
	$(DC) down

build:
	$(DC) up -d --build

logs:
	$(DC) logs -f

ps:
	$(DC) ps

bash:
	$(EXEC_PHP) bash

composer:
	$(EXEC_PHP) composer install

migrate:
	$(EXEC_PHP) php bin/console doctrine:migrations:migrate --no-interaction

dbshell:
	$(DC) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

ollama-pull:
	@docker compose exec ollama sh -c 'ollama pull "$$OLLAMA_MODEL"'
	@echo "✅ Modèle téléchargé et prêt !"

ollama-list:
	@echo "📋 Modèles Ollama disponibles:"
	@docker compose exec ollama ollama list

ollama-bash:
	@docker compose exec ollama sh

adminer:
	@echo "🌐 Adminer disponible sur: http://localhost:8080"
	@echo "   Serveur: db"
	@echo "   Identifiants: voir POSTGRES_* dans .env"

pgadmin:
	@echo "🌐 pgAdmin disponible sur: http://localhost:5050"
	@echo "   Identifiants: voir PGADMIN_* dans .env"
	@echo ""
	@echo "   Lors de la première connexion, ajoutez le serveur:"
	@echo "   - Nom: Woofie DB"
	@echo "   - Host: db"
	@echo "   - Port: 5432"
	@echo "   - Identifiants PostgreSQL: voir .env"

node-bash:
	$(EXEC_NODE) sh

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
	$(DC_PROD) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

prod-ollama:
	$(DC_PROD) exec ollama sh -c 'ollama pull "$$OLLAMA_MODEL"'
	@echo "✅ Modèle prêt !"

prod-update:
	@echo "🔄 Mise à jour de Woofie en production..."
	git pull origin main
	$(DC_PROD) build --no-cache
	$(DC_PROD) up -d --force-recreate
	$(DC_PROD) exec symfony php bin/console doctrine:migrations:migrate --no-interaction
	@echo "✅ Mise à jour terminée"
