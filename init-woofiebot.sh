#!/bin/bash

# Script d'initialisation de WoofieBot avec Ollama

set -e

echo "🐕 Initialisation de WoofieBot..."

# Attendre que le service Ollama soit prêt
echo "⏳ Attente du démarrage d'Ollama..."
until docker exec woofie-ollama ollama list >/dev/null 2>&1; do
  echo "  Ollama n'est pas encore prêt, nouvelle tentative dans 3s..."
  sleep 3
done

echo "✅ Ollama est prêt!"

# Vérifier si llama3.2 est déjà installé
if docker exec woofie-ollama ollama list | grep -q "llama3.2"; then
  echo "✅ Le modèle llama3.2 est déjà installé"
else
  echo "📥 Téléchargement du modèle llama3.2 (environ 2GB)..."
  echo "   Cela peut prendre plusieurs minutes..."
  docker exec woofie-ollama ollama pull llama3.2
  echo "✅ Modèle llama3.2 téléchargé avec succès!"
fi

# Test du modèle
echo ""
echo "🧪 Test de WoofieBot..."
docker exec woofie-ollama ollama run llama3.2 "Réponds en 1 phrase: Pourquoi les chiens remuent la queue?" --format json

echo ""
echo "🎉 WoofieBot est prêt!"
echo ""
echo "📍 Accédez au chat: http://localhost:3000/messages"
echo "🐕 WoofieBot apparaîtra automatiquement dans vos conversations"
