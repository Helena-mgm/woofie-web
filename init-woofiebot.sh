#!/bin/bash

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
if [ ! -f "${ENV_FILE}" ]; then
  echo "Fichier ${ENV_FILE} introuvable. Copiez .env.example vers .env."
  exit 1
fi

MODEL="$(sed -n 's/^OLLAMA_MODEL=//p' "${ENV_FILE}" | head -n 1)"
if [ -z "${MODEL}" ]; then
  echo "OLLAMA_MODEL est absent de ${ENV_FILE}."
  exit 1
fi

echo "🐕 Initialisation de WoofieBot..."

# Attendre que le service Ollama soit prêt
echo "⏳ Attente du démarrage d'Ollama..."
until docker compose exec ollama ollama list >/dev/null 2>&1; do
  echo "  Ollama n'est pas encore prêt, nouvelle tentative dans 3s..."
  sleep 3
done

echo "✅ Ollama est prêt!"

if docker compose exec ollama ollama list | grep -Fq "${MODEL}"; then
  echo "✅ Le modèle ${MODEL} est déjà installé"
else
  echo "📥 Téléchargement du modèle ${MODEL}..."
  echo "   Cela peut prendre plusieurs minutes..."
  docker compose exec ollama ollama pull "${MODEL}"
  echo "✅ Modèle ${MODEL} téléchargé avec succès!"
fi

# Test du modèle
echo ""
echo "🧪 Test de WoofieBot..."
docker compose exec ollama ollama run "${MODEL}" "Réponds en 1 phrase: Pourquoi les chiens remuent la queue?" --format json

echo ""
echo "🎉 WoofieBot est prêt!"
echo ""
echo "📍 Accédez au chat: http://localhost:3000/messages"
echo "🐕 WoofieBot apparaîtra automatiquement dans vos conversations"
