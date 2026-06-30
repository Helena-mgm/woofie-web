#!/usr/bin/env bash
# ============================================================
# 🐾 deploy.sh — Script de déploiement Woofie en production
# Domaine : https://woofie.ovh  |  VPS : 152.228.140.199
# ============================================================
# Usage (depuis le VPS, dans le répertoire du projet) :
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Pour les mises à jour suivantes, utilisez plutôt :
#   make prod-update
# ============================================================

set -euo pipefail

DOMAIN="woofie.ovh"
CERT_PATH="./certbot/conf/live/${DOMAIN}/fullchain.pem"

# ── Couleurs ──────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}▶  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠  $1${NC}"; }
error()   { echo -e "${RED}✗  $1${NC}"; exit 1; }

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🐾  Woofie — Déploiement Production                 ║"
echo "║  https://${DOMAIN}                             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ── 0. Prérequis ──────────────────────────────────────────
info "Vérification des prérequis..."

command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé."
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 requis (plugin 'docker compose')."

if [ ! -f ".env.prod" ]; then
    error "Fichier .env.prod manquant !
   → Copiez le template : cp .env.prod.example .env.prod
   → Remplissez toutes les valeurs CHANGEZ_MOI
   → Relancez ce script"
fi

# Vérifier que les placeholders ont bien été remplacés
if grep -q "CHANGEZ_" .env.prod; then
    error "Le fichier .env.prod contient encore des valeurs placeholder (CHANGEZ_...).
   Éditez-le et renseignez vos vraies valeurs, puis relancez."
fi

mkdir -p ./certbot/conf ./certbot/www

# ── 1. Certificat SSL (seulement au premier déploiement) ──
if [ ! -f "$CERT_PATH" ]; then
    echo ""
    info "Premier déploiement — obtention du certificat SSL Let's Encrypt..."
    warning "Le domaine ${DOMAIN} doit pointer vers 152.228.140.199 (vérifiez votre DNS OVH)."
    echo ""

    # Charge l'email depuis .env.prod
    CERTBOT_EMAIL=$(grep '^CERTBOT_EMAIL=' .env.prod | cut -d'=' -f2 | tr -d '[:space:]')
    CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

    # Démarrage d'un nginx temporaire (HTTP only) pour le challenge ACME
    info "Démarrage du nginx temporaire pour le challenge ACME..."
    docker run -d --name nginx-certbot-init \
        -p 80:80 \
        -v "$(pwd)/nginx/nginx.init.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        nginx:stable-alpine

    sleep 3

    # Obtention du certificat via webroot (le renouvellement utilisera aussi webroot)
    info "Demande du certificat à Let's Encrypt (email: ${CERTBOT_EMAIL})..."
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot --webroot-path=/var/www/certbot \
        --email "${CERTBOT_EMAIL}" \
        --agree-tos --no-eff-email \
        -d "${DOMAIN}" -d "www.${DOMAIN}" || {
            docker stop nginx-certbot-init && docker rm nginx-certbot-init 2>/dev/null || true
            error "Échec Let's Encrypt. Vérifiez :
   - DNS : ${DOMAIN} → 152.228.140.199  (propagation parfois ~5 min)
   - Port 80 ouvert dans le firewall OVH du VPS
   - Aucun autre service sur le port 80"
        }

    # Nettoyage du nginx temporaire
    docker stop nginx-certbot-init && docker rm nginx-certbot-init
    echo ""
    info "Certificat SSL obtenu avec succès !"
else
    info "Certificat SSL déjà présent — étape SSL ignorée."
fi

# ── 2. Build des images Docker ────────────────────────────
echo ""
info "Build des images Docker (peut prendre 5-10 min la première fois)..."
docker compose -f docker-compose.prod.yaml --env-file .env.prod build --no-cache

# ── 3. Démarrage de la stack ──────────────────────────────
echo ""
info "Démarrage de la stack de production..."
docker compose -f docker-compose.prod.yaml --env-file .env.prod up -d

# ── 4. Attente que les services soient prêts ──────────────
echo ""
info "Attente que les services démarrent (45s)..."
sleep 45

# ── 5. Migrations de base de données ─────────────────────
echo ""
info "Exécution des migrations Doctrine..."
docker compose -f docker-compose.prod.yaml --env-file .env.prod exec symfony \
    php bin/console doctrine:migrations:migrate --no-interaction || \
    warning "Migrations échouées — relancez avec : make prod-migrate"

# ── 6. Chargement du modèle Ollama (WoofieBot) ───────────
echo ""
info "Chargement du modèle Ollama llama3.2 (~2GB, peut prendre plusieurs minutes)..."
docker compose -f docker-compose.prod.yaml --env-file .env.prod exec ollama \
    ollama pull llama3.2 || \
    warning "Pull Ollama échoué — lancez manuellement : make prod-ollama"

# ── Résumé ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗"
echo    "║  ✅  Woofie est en production !                       ║"
echo    "║                                                       ║"
echo    "║  🌐  https://woofie.ovh                               ║"
echo    "║  🔐  SSL : Let's Encrypt (renouvellement auto)        ║"
echo    "║                                                       ║"
echo    "║  Commandes utiles :                                   ║"
echo    "║    make prod-logs     → voir les logs                 ║"
echo    "║    make prod-ps       → état des containers           ║"
echo    "║    make prod-update   → mettre à jour l'app           ║"
echo -e "╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
