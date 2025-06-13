#!/bin/bash

# Script de mise à jour via Git pour my-library.cloud
# Usage: ./update.sh

set -e

echo "🔄 Mise à jour de my-library.cloud via Git..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Sauvegarder les changements locaux si nécessaire
log_info "Vérification des changements locaux..."
if ! git diff --quiet; then
    log_warn "Changements locaux détectés, sauvegarde..."
    git stash push -m "Auto-stash before update $(date)"
fi

# Récupérer les dernières modifications
log_info "Récupération des dernières modifications..."
git fetch origin

# Mettre à jour vers la dernière version
log_info "Mise à jour du code..."
git pull origin main

# Redéployer l'application
log_info "Redéploiement de l'application..."
./deploy.sh

log_info "✅ Mise à jour terminée!"
log_info "Application accessible sur https://my-library.cloud" 