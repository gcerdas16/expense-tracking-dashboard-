#!/bin/bash

# Script para obtener tokens de Slack desde Google Secret Manager
# Uso: ./get-slack-tokens.sh

PROJECT_ID="finanzaspersonales-480101"

echo "🔐 Obteniendo tokens de Slack desde Secret Manager..."
echo ""

echo "📝 SLACK_BOT_TOKEN:"
gcloud secrets versions access latest --secret="SLACK_BOT_TOKEN" --project="$PROJECT_ID"
echo ""

echo "📝 SLACK_CHANNEL_ID:"
gcloud secrets versions access latest --secret="SLACK_CHANNEL_ID" --project="$PROJECT_ID"
echo ""

echo "✅ Copia estos valores y agrégalos como variables de entorno en Railway"
