#!/usr/bin/env bash

set -euo pipefail

ENV_FILE=".env.prod"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}▶  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠  $1${NC}"; }
error()   { echo -e "${RED}✗  $1${NC}"; exit 1; }

info "Vérification des prérequis..."

command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé."
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 requis (plugin 'docker compose')."
docker info >/dev/null 2>&1 || error "Accès à Docker refusé.
    → Ajoutez votre utilisateur au groupe Docker : sudo usermod -aG docker \"$USER\"
    → Déconnectez-vous puis reconnectez-vous (ou redémarrez votre session SSH)
    → Relancez ensuite ./deploy.sh"

if [ ! -f "${ENV_FILE}" ]; then
    error "Fichier .env.prod manquant !
   → Copiez le template : cp .env.prod.example .env.prod
   → Remplissez toutes les valeurs CHANGEZ_MOI
   → Relancez ce script"
fi

if grep -qE "CHANGEZ_|CHANGE_ME" "${ENV_FILE}"; then
    error "Le fichier .env.prod contient encore des valeurs placeholder (CHANGEZ_...).
   Éditez-le et renseignez vos vraies valeurs, puis relancez."
fi

require_env_var() {
    local name="$1"
    if ! grep -Eq "^${name}=.+$" "${ENV_FILE}"; then
        error "Variable ${name} manquante dans .env.prod."
    fi
}

read_env_var() {
    local name="$1"
    sed -n "s/^${name}=//p" "${ENV_FILE}" | head -n 1
}

for required_var in \
    POSTGRES_USER \
    POSTGRES_PASSWORD \
    POSTGRES_DB \
    APP_DOMAIN \
    APP_URL \
    APP_SECRET \
    JWT_SECRET \
    JWT_TTL_SECONDS \
    AUTH_COOKIE_SECURE \
    CORS_ALLOW_ORIGIN \
    UPLOAD_MAX_BYTES \
    UPLOAD_MAX_PIXELS \
    NGINX_UPLOAD_MAX_SIZE \
    OLLAMA_API_URL \
    OLLAMA_MODEL \
    OLLAMA_TIMEOUT_SECONDS \
    OLLAMA_MAX_RESPONSE_CHARS \
    INTERNAL_API_BASE \
    CERTBOT_EMAIL
do
    require_env_var "${required_var}"
done

DOMAIN="$(read_env_var APP_DOMAIN)"
APP_URL="$(read_env_var APP_URL)"
OLLAMA_MODEL="$(read_env_var OLLAMA_MODEL)"
CERTBOT_EMAIL="$(read_env_var CERTBOT_EMAIL)"
CERT_PATH="./certbot/conf/live/${DOMAIN}/fullchain.pem"

if [ "${APP_URL}" != "https://${DOMAIN}" ]; then
    error "APP_URL doit correspondre à https://APP_DOMAIN."
fi

echo ""
echo "🐾 Woofie — déploiement de ${APP_URL}"
echo ""

if ! grep -Eq '^AUTH_COOKIE_SECURE=1$' .env.prod; then
    warning "AUTH_COOKIE_SECURE devrait valoir 1 en production."
fi

mkdir -p ./certbot/conf ./certbot/www

if [ ! -f "$CERT_PATH" ]; then
    echo ""
    info "Premier déploiement — obtention du certificat SSL Let's Encrypt..."
    warning "Le domaine ${DOMAIN} doit pointer vers ce serveur."
    echo ""

    info "Démarrage du nginx temporaire pour le challenge ACME..."
    docker run -d --name nginx-certbot-init \
        -p 80:80 \
        -e "APP_DOMAIN=${DOMAIN}" \
        -e 'NGINX_ENVSUBST_FILTER=^(APP_DOMAIN)$' \
        -e 'NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx' \
        -v "$(pwd)/nginx/nginx.init.conf.template:/etc/nginx/templates/nginx.conf.template:ro" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        nginx:stable-alpine

    sleep 3

    info "Demande du certificat à Let's Encrypt (email: ${CERTBOT_EMAIL})..."
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot --webroot-path=/var/www/certbot \
        --email "${CERTBOT_EMAIL}" \
        --agree-tos --no-eff-email \
        --non-interactive --keep-until-expiring \
        -d "${DOMAIN}" -d "www.${DOMAIN}" || {
            docker stop nginx-certbot-init && docker rm nginx-certbot-init 2>/dev/null || true
            error "Échec Let's Encrypt. Vérifiez :
   - DNS : ${DOMAIN} doit pointer vers ce serveur
   - Port 80 ouvert dans le firewall OVH du VPS
   - Aucun autre service sur le port 80"
        }

    docker stop nginx-certbot-init && docker rm nginx-certbot-init
    echo ""
    info "Certificat SSL obtenu avec succès !"
else
    info "Certificat SSL déjà présent — étape SSL ignorée."
fi

echo ""
info "Build des images Docker (peut prendre 5-10 min la première fois)..."
docker compose -f docker-compose.prod.yaml --env-file "${ENV_FILE}" build --no-cache

echo ""
info "Démarrage de la stack de production..."
docker compose -f docker-compose.prod.yaml --env-file "${ENV_FILE}" up -d

echo ""
info "Attente que les services démarrent (45s)..."
sleep 45

echo ""
info "Exécution des migrations Doctrine..."
docker compose -f docker-compose.prod.yaml --env-file "${ENV_FILE}" exec -u www-data symfony \
    php bin/console doctrine:migrations:migrate --no-interaction
docker compose -f docker-compose.prod.yaml --env-file "${ENV_FILE}" exec -u www-data symfony \
    php bin/console cache:clear --env=prod

echo ""
info "Chargement du modèle Ollama ${OLLAMA_MODEL} (peut prendre plusieurs minutes)..."
docker compose -f docker-compose.prod.yaml --env-file "${ENV_FILE}" exec ollama \
    ollama pull "${OLLAMA_MODEL}" || \
    warning "Pull Ollama échoué — lancez manuellement : make prod-ollama"

echo ""
echo -e "${GREEN}✅ Woofie est en production sur ${APP_URL}.${NC}"
echo "SSL Let's Encrypt est actif et son renouvellement est automatisé."
echo "Commandes utiles : make prod-logs, make prod-ps, make prod-update"
echo ""
