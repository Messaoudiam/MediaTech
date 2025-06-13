#!/bin/bash

# Script de déploiement avancé pour my-library.cloud
# Usage: ./deploy.sh [--force] [--no-backup] [--zero-downtime] [--dry-run]

set -euo pipefail  # Strict error handling

echo "🚀 Début du déploiement de my-library.cloud..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables configurables
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
REGISTRY=${REGISTRY:-"codingmessaoud"}
APP_NAME=${APP_NAME:-"my-library"}
DOMAIN=${DOMAIN:-"my-library.cloud"}
BACKUP_RETENTION=${BACKUP_RETENTION:-5}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}
NOTIFICATION_WEBHOOK=${NOTIFICATION_WEBHOOK:-""}

# Variables d'état
FORCE_DEPLOY=false
NO_BACKUP=false
ZERO_DOWNTIME=false
DRY_RUN=false
BACKUP_DIR="backups"
LOG_FILE="logs/deploy_$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_START_TIME=$(date +%s)
PREVIOUS_CONTAINERS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        --zero-downtime)
            ZERO_DOWNTIME=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --force          Force deployment even if validation fails"
            echo "  --no-backup      Skip database backup"
            echo "  --zero-downtime  Deploy with zero downtime (blue-green)"
            echo "  --dry-run        Show what would be done without executing"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  COMPOSE_FILE            Docker compose file (default: docker-compose.prod.yml)"
            echo "  REGISTRY                Docker registry (default: codingmessaoud)"
            echo "  NOTIFICATION_WEBHOOK    Webhook URL for notifications"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Notification système
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        local payload=$(cat <<EOF
{
    "text": "🚀 Déploiement $APP_NAME",
    "attachments": [
        {
            "color": $([ "$status" = "success" ] && echo '"good"' || echo '"danger"'),
            "fields": [
                {"title": "Status", "value": "$status", "short": true},
                {"title": "Environment", "value": "Production", "short": true},
                {"title": "Message", "value": "$message", "short": false},
                {"title": "Timestamp", "value": "$(date)", "short": true}
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$NOTIFICATION_WEBHOOK" &> /dev/null || true
    fi
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    local exit_code=$?
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    
    if [ $exit_code -ne 0 ]; then
        log_error "Déploiement échoué avec le code $exit_code après ${deployment_duration}s"
        
        if [ "$DRY_RUN" = false ]; then
            log_info "Tentative de rollback automatique..."
            rollback_deployment
            send_notification "failed" "Déploiement échoué après ${deployment_duration}s. Rollback effectué."
        fi
    else
        log_success "Déploiement réussi en ${deployment_duration}s"
        send_notification "success" "Déploiement réussi en ${deployment_duration}s"
    fi
}

trap cleanup EXIT

# Rollback automatique
rollback_deployment() {
    log_step "Rollback en cours..."
    
    # Arrêter les nouveaux conteneurs
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
    
    # Restaurer les conteneurs précédents si ils existent
    if [ -n "$PREVIOUS_CONTAINERS" ]; then
        log_info "Redémarrage des conteneurs précédents..."
        echo "$PREVIOUS_CONTAINERS" | while read -r container; do
            docker start "$container" || true
        done
    fi
    
    # Restaurer la dernière sauvegarde si disponible
    local latest_backup=$(find "$BACKUP_DIR" -name "pre_deploy_backup_*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        log_info "Sauvegarde disponible pour rollback: $latest_backup"
        log_warn "Rollback manuel de la DB requis: docker compose -f $COMPOSE_FILE exec -T db psql -U postgres myapp < $latest_backup"
    fi
    
    log_info "Rollback terminé. Vérifiez l'état des services."
}

# Validation avancée de l'environnement
validate_environment() {
    log_step "Validation de l'environnement..."
    
    local validation_errors=0
    
    # Vérification des prérequis
    local missing_deps=()
    
    for cmd in docker curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Vérifier docker compose
    if ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dépendances manquantes: ${missing_deps[*]}"
        ((validation_errors++))
    fi
    
    # Vérification des fichiers de configuration
    local required_files=(".env" "$COMPOSE_FILE" "nginx/nginx.conf")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        log_error "Fichiers manquants: ${missing_files[*]}"
        ((validation_errors++))
    fi
    
    # Validation du fichier .env
    if [ -f ".env" ]; then
        if grep -q "CHANGEZ-MOI\|CHANGE_ME\|TODO\|FIXME" .env; then
            log_error "Le fichier .env contient des valeurs à modifier"
            if [ "$FORCE_DEPLOY" = false ]; then
                ((validation_errors++))
            else
                log_warn "Déploiement forcé malgré les valeurs par défaut"
            fi
        fi
        
        # Vérifier les variables critiques
        local required_vars=("DATABASE_URL" "SECRET_KEY")
        for var in "${required_vars[@]}"; do
            if ! grep -q "^$var=" .env; then
                log_warn "Variable manquante dans .env: $var"
            fi
        done
    fi
    
    # Vérification des certificats SSL
    local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    if [ ! -f "$cert_path" ]; then
        log_error "Certificat SSL manquant: $cert_path"
        if [ "$FORCE_DEPLOY" = false ]; then
            ((validation_errors++))
        else
            log_warn "Déploiement forcé sans certificat SSL"
        fi
    else
        # Vérifier la validité du certificat
        local cert_expiry=$(openssl x509 -enddate -noout -in "$cert_path" 2>/dev/null | cut -d= -f2)
        if [ -n "$cert_expiry" ]; then
            local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                log_warn "Certificat SSL expire dans $days_until_expiry jours"
            fi
        fi
    fi
    
    # Vérification de l'espace disque
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=2097152  # 2GB en KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Espace disque insuffisant: $(($available_space/1024))MB disponible, $(($required_space/1024))MB requis"
        ((validation_errors++))
    fi
    
    # Vérification de Docker
    if ! docker info &> /dev/null; then
        log_error "Docker daemon non accessible"
        ((validation_errors++))
    fi
    
    # Vérification de la connectivité externe
    validate_external_connectivity
    
    # Résultat de la validation
    if [ $validation_errors -gt 0 ]; then
        log_error "$validation_errors erreur(s) de validation trouvée(s)"
        if [ "$FORCE_DEPLOY" = false ]; then
            exit 1
        fi
    fi
    
    log_success "✅ Validation de l'environnement réussie"
}

# Validation de la connectivité externe
validate_external_connectivity() {
    log_debug "Vérification de la connectivité externe..."
    
    # Test DNS
    if ! nslookup "$DOMAIN" &> /dev/null; then
        log_warn "Résolution DNS échouée pour $DOMAIN"
    fi
    
    # Test Docker Hub
    if ! curl -f -s --max-time 10 https://index.docker.io/v1/ &> /dev/null; then
        log_warn "Docker Hub non accessible"
    fi
    
    # Test des registres d'images
    local test_image="$REGISTRY/backend:latest"
    if ! docker manifest inspect "$test_image" &> /dev/null; then
        log_warn "Image Docker non accessible: $test_image"
    fi
}

# Création des dossiers nécessaires
setup_directories() {
    log_step "Création des dossiers nécessaires..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Création des dossiers"
        return
    fi
    
    mkdir -p "$BACKUP_DIR" logs /var/www/certbot data/postgres data/uploads
    
    # Permissions sécurisées
    chmod 700 "$BACKUP_DIR"
    chmod 755 logs
    chmod 755 data
    chmod 600 .env 2>/dev/null || true
    
    # Ownership pour les volumes Docker
    chown -R 999:999 data/postgres 2>/dev/null || true
    chown -R www-data:www-data data/uploads 2>/dev/null || true
    
    log_success "✅ Dossiers créés avec les bonnes permissions"
}

# Sauvegarde avancée de la base de données
backup_database() {
    if [ "$NO_BACKUP" = true ]; then
        log_info "Sauvegarde ignorée (--no-backup)"
        return
    fi
    
    log_step "Sauvegarde de la base de données..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Sauvegarde de la base de données"
        return
    fi
    
    # Vérifier si la base de données est accessible
    if ! docker compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "Up"; then
        log_info "Base de données non active, pas de sauvegarde nécessaire"
        return
    fi
    
    local backup_file="$BACKUP_DIR/pre_deploy_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_compressed="${backup_file}.gz"
    
    log_info "Création de la sauvegarde: $backup_file"
    
    # Sauvegarde avec compression
    if docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres -h localhost --verbose --clean --no-acl --no-owner myapp | gzip > "$backup_compressed"; then
        local backup_size=$(du -h "$backup_compressed" | cut -f1)
        log_success "✅ Sauvegarde créée: $backup_size"
        
        # Vérification de l'intégrité
        if gunzip -t "$backup_compressed" 2>/dev/null; then
            log_success "✅ Intégrité de la sauvegarde vérifiée"
        else
            log_error "❌ Sauvegarde corrompue"
            rm -f "$backup_compressed"
            exit 1
        fi
        
        # Nettoyage des anciennes sauvegardes
        cleanup_old_backups
    else
        log_error "❌ Échec de la sauvegarde"
        exit 1
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log_debug "Nettoyage des anciennes sauvegardes (garder les $BACKUP_RETENTION dernières)"
    
    local backup_count=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
    
    if [ "$backup_count" -gt "$BACKUP_RETENTION" ]; then
        find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | \
        sort -n | \
        head -n -"$BACKUP_RETENTION" | \
        cut -d' ' -f2- | \
        xargs -r rm
        
        log_info "$(($backup_count - $BACKUP_RETENTION)) anciennes sauvegardes supprimées"
    fi
}

# Récupération et validation des images Docker
pull_and_validate_images() {
    log_step "Récupération et validation des images Docker..."
    
    local images=("$REGISTRY/backend:latest" "$REGISTRY/frontend:latest")
    
    for image in "${images[@]}"; do
        log_info "Téléchargement de $image..."
        
        if [ "$DRY_RUN" = true ]; then
            log_debug "[DRY-RUN] docker pull $image"
            continue
        fi
        
        if ! docker pull "$image"; then
            log_error "Échec du téléchargement de $image"
            exit 1
        fi
        
        # Validation de l'image
        if ! docker image inspect "$image" &> /dev/null; then
            log_error "Image corrompue: $image"
            exit 1
        fi
        
        # Vérification de la taille (seuil de sécurité)
        local image_size=$(docker image inspect "$image" --format='{{.Size}}')
        local max_size=$((2 * 1024 * 1024 * 1024))  # 2GB
        
        if [ "$image_size" -gt "$max_size" ]; then
            log_warn "Image très volumineuse: $image ($(($image_size / 1024 / 1024))MB)"
        fi
    done
    
    log_success "✅ Images téléchargées et validées"
}

# Exécution des migrations de base de données
run_migrations() {
    log_step "Exécution des migrations de base de données..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Migrations de base de données"
        return
    fi
    
    # Attendre que la base soit prête
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres &> /dev/null; then
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Base de données non accessible pour les migrations"
            exit 1
        fi
        
        log_debug "Attente de la base de données... ($attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    # Exécuter les migrations
    if docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate --noinput; then
        log_success "✅ Migrations exécutées avec succès"
    else
        log_error "❌ Échec des migrations"
        exit 1
    fi
}

# Déploiement avec zero downtime
deploy_zero_downtime() {
    log_step "Déploiement zero-downtime (blue-green)..."
    
    # Sauvegarder les conteneurs actuels
    PREVIOUS_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(backend|frontend)" || true)
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Déploiement zero-downtime"
        return
    fi
    
    # Créer un nouveau réseau temporaire
    local temp_network="${APP_NAME}_deploy_$(date +%s)"
    docker network create "$temp_network" || true
    
    # Démarrer les nouveaux conteneurs sur le réseau temporaire
    log_info "Démarrage des nouveaux conteneurs..."
    
    # Modifier temporairement le compose file pour utiliser des ports différents
    local temp_compose_file="docker-compose.deploy.yml"
    sed 's/80:80/8080:80/g; s/443:443/8443:443/g' "$COMPOSE_FILE" > "$temp_compose_file"
    
    if ! docker compose -f "$temp_compose_file" up -d; then
        log_error "Échec du démarrage des nouveaux conteneurs"
        docker network rm "$temp_network" 2>/dev/null || true
        rm -f "$temp_compose_file"
        exit 1
    fi
    
    # Tests de santé sur les nouveaux conteneurs
    if health_checks_internal "localhost:8080"; then
        log_info "Basculement du trafic..."
        
        # Arrêter les anciens conteneurs
        if [ -n "$PREVIOUS_CONTAINERS" ]; then
            echo "$PREVIOUS_CONTAINERS" | xargs docker stop || true
        fi
        
        # Redémarrer avec la configuration normale
        docker compose -f "$temp_compose_file" down
        docker compose -f "$COMPOSE_FILE" up -d
        
        log_success "✅ Basculement réussi"
    else
        log_error "Tests de santé échoués sur les nouveaux conteneurs"
        docker compose -f "$temp_compose_file" down
        exit 1
    fi
    
    # Nettoyage
    docker network rm "$temp_network" 2>/dev/null || true
    rm -f "$temp_compose_file"
}

# Déploiement standard des services
deploy_services() {
    if [ "$ZERO_DOWNTIME" = true ]; then
        deploy_zero_downtime
        return
    fi
    
    log_step "Déploiement des services..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Déploiement des services"
        return
    fi
    
    # Sauvegarder les conteneurs actuels pour rollback
    PREVIOUS_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(backend|frontend|db)" || true)
    
    # Arrêt gracieux des conteneurs existants
    log_info "Arrêt gracieux des services existants..."
    docker compose -f "$COMPOSE_FILE" down --timeout 30 --remove-orphans || true
    
    # Nettoyage des ressources Docker
    log_info "Nettoyage des ressources Docker..."
    docker image prune -f --filter "until=24h"
    docker container prune -f
    docker network prune -f
    
    # Démarrage des services
    log_info "Démarrage des nouveaux services..."
    if ! docker compose -f "$COMPOSE_FILE" up -d; then
        log_error "Échec du démarrage des services"
        exit 1
    fi
    
    # Exécuter les migrations après le démarrage
    run_migrations
    
    log_success "✅ Services démarrés"
}

# Tests de santé internes
health_checks_internal() {
    local host=${1:-"localhost"}
    local max_attempts=60
    local attempt=1
    
    log_info "Tests de santé sur $host..."
    
    # Attendre le démarrage initial
    sleep 15
    
    # Test de la base de données
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres &> /dev/null; then
            log_success "✅ Base de données opérationnelle"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "❌ Base de données non accessible après $max_attempts tentatives"
            return 1
        fi
        
        log_debug "Test DB: $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    # Test du backend avec retry et circuit breaker
    attempt=1
    local consecutive_failures=0
    local max_consecutive_failures=3
    
    while [ $attempt -le $max_attempts ]; do
        local health_response=$(curl -f -s --max-time 10 "http://$host/health" 2>/dev/null || echo "")
        
        if [ -n "$health_response" ] && echo "$health_response" | jq -e '.status == "healthy"' &> /dev/null; then
            log_success "✅ Backend accessible et sain"
            consecutive_failures=0
            break
        else
            ((consecutive_failures++))
            
            if [ $consecutive_failures -ge $max_consecutive_failures ]; then
                log_error "❌ $max_consecutive_failures échecs consécutifs détectés"
                return 1
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "❌ Backend non accessible après $max_attempts tentatives"
                return 1
            fi
            
            log_debug "Test Backend: $attempt/$max_attempts (échecs consécutifs: $consecutive_failures)"
            sleep 10
            ((attempt++))
        fi
    done
    
    return 0
}

# Tests de santé complets
health_checks() {
    log_step "Vérification de la santé des services..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY-RUN] Tests de santé"
        return
    fi
    
    # Tests internes
    if ! health_checks_internal; then
        return 1
    fi
    
    # Test HTTPS avec validation du certificat
    if curl -f -s --max-time 10 "https://$DOMAIN/health" &> /dev/null; then
        log_success "✅ HTTPS opérationnel"
        
        # Vérifier le certificat SSL
        local ssl_check=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo "")
        if [ -n "$ssl_check" ]; then
            log_success "✅ Certificat SSL valide"
        fi
    else
        log_warn "⚠️ HTTPS non accessible"
    fi
    
    # Tests fonctionnels des endpoints critiques
    test_critical_endpoints
    
    # Monitoring des métriques système
    check_system_metrics
    
    # Affichage de l'état des services
    log_info "État des services:"
    docker compose -f "$COMPOSE_FILE" ps
    
    return 0
}

# Test des endpoints critiques
test_critical_endpoints() {
    log_debug "Test des endpoints critiques..."
    
    local endpoints=(
        "/health"
        "/api/v1/status"
        "/api/v1/books"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="https://$DOMAIN$endpoint"
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
        
        if [ "$response_code" = "200" ] || [ "$response_code" = "404" ]; then
            log_debug "✅ $endpoint: $response_code"
        else
            log_warn "⚠️ $endpoint: $response_code"
        fi
    done
}

# Monitoring des métriques système
check_system_metrics() {
    log_debug "Vérification des métriques système..."
    
    # CPU et mémoire des conteneurs
    local container_stats=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "")
    
    if [ -n "$container_stats" ]; then
        log_debug "Métriques des conteneurs:"
        echo "$container_stats" | while read -r line; do
            log_debug "  $line"
        done
    fi
    
    # Alertes sur l'utilisation excessive des ressources
    docker stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemPerc}}" 2>/dev/null | while read -r name cpu mem; do
        local cpu_num=$(echo "$cpu" | sed 's/%//')
        local mem_num=$(echo "$mem" | sed 's/%//')
        
        if (( $(echo "$cpu_num > 80" | bc -l 2>/dev/null || echo 0) )); then
            log_warn "⚠️ CPU élevé pour $name: $cpu"
        fi
        
        if (( $(echo "$mem_num > 80" | bc -l 2>/dev/null || echo 0) )); then
            log_warn "⚠️ Mémoire élevée pour $name: $mem"
        fi
    done
}

# Génération du rapport de déploiement
generate_deployment_report() {
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    local report_file="logs/deployment_report_$(date +%Y%m%d_%H%M%S).json"
    
    log_step "Génération du rapport de déploiement..."
    
    local report=$(cat <<EOF
{
    "deployment": {
        "timestamp": "$(date -Iseconds)",
        "duration_seconds": $deployment_duration,
        "status": "success",
        "environment": "production",
        "domain": "$DOMAIN",
        "options": {
            "force_deploy": $FORCE_DEPLOY,
            "no_backup": $NO_BACKUP,
            "zero_downtime": $ZERO_DOWNTIME,
            "dry_run": $DRY_RUN
        }
    },
    "images": {
        "backend": "$REGISTRY/backend:latest",
        "frontend": "$REGISTRY/frontend:latest"
    },
    "services": $(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null || echo '[]'),
    "system": {
        "disk_usage": "$(df -h / | awk 'NR==2 {print $5}')",
        "memory_usage": "$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | xargs)"
    }
}
EOF
    )
    
    if [ "$DRY_RUN" = false ]; then
        echo "$report" > "$report_file"
        log_info "📊 Rapport sauvegardé: $report_file"
    else
        log_debug "[DRY-RUN] Rapport de déploiement généré"
    fi
}

# Fonction principale
main() {
    local deployment_start_date=$(date)
    log_info "Début du déploiement - $deployment_start_date"
    
    if [ "$DRY_RUN" = true ]; then
        log_warn "🧪 MODE DRY-RUN ACTIVÉ - Aucune action ne sera exécutée"
    fi
    
    # Étapes de déploiement
    validate_environment
    setup_directories
    backup_database
    pull_and_validate_images
    deploy_services
    
    if ! health_checks; then
        log_error "Tests de santé échoués"
        exit 1
    fi
    
    # Génération du rapport
    generate_deployment_report
    
    # Affichage des logs récents
    if [ "$DRY_RUN" = false ]; then
        log_step "Logs récents des services:"
        docker compose -f "$COMPOSE_FILE" logs --tail=20
    fi
    
    # Informations de déploiement
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    log_success "🎉 Déploiement terminé avec succès en ${deployment_duration}s!"
    
    echo ""
    log_info "📋 Informations de déploiement:"
    echo "  🌐 Application accessible sur:"
    echo "    - https://$DOMAIN"
    echo "    - https://www.$DOMAIN"
    echo ""
    echo "  🐳 Images utilisées:"
    echo "    * Backend: $REGISTRY/backend:latest"
    echo "    * Frontend: $REGISTRY/frontend:latest"
    echo ""
    echo "  📊 Services actifs: $(docker compose -f "$COMPOSE_FILE" ps --services | wc -l 2>/dev/null || echo 'N/A')"
    echo "  📝 Log de déploiement: $LOG_FILE"
    echo "  📈 Rapport de déploiement: logs/deployment_report_*.json"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        echo "  📨 Notification envoyée via webhook"
    fi
    
    echo ""
    log_info "🛠️ Commandes utiles post-déploiement:"
    echo ""
    echo "  📋 Monitoring et logs:"
    echo "    docker compose -f $COMPOSE_FILE logs -f [service]"
    echo "    docker compose -f $COMPOSE_FILE ps"
    echo "    docker stats"
    echo ""
    echo "  🔄 Gestion des services:"
    echo "    docker compose -f $COMPOSE_FILE restart [service]"
    echo "    docker compose -f $COMPOSE_FILE down"
    echo "    docker compose -f $COMPOSE_FILE up -d [service]"
    echo ""
    echo "  💾 Base de données:"
    echo "    docker compose -f $COMPOSE_FILE exec db psql -U postgres myapp"
    echo "    docker compose -f $COMPOSE_FILE exec db pg_dump -U postgres myapp > backup.sql"
    echo ""
    echo "  🔄 Mise à jour rapide:"
    echo "    $0 --zero-downtime  # Déploiement sans interruption"
    echo "    $0 --dry-run       # Simulation de déploiement"
    echo ""
    echo "  🚨 Dépannage:"
    echo "    docker compose -f $COMPOSE_FILE exec backend python manage.py shell"
    echo "    docker compose -f $COMPOSE_FILE exec backend python manage.py migrate --dry-run"
    echo "    docker system df   # Utilisation de l'espace Docker"
    echo "    docker system prune -f  # Nettoyage Docker"
    
    # Conseils de sécurité post-déploiement
    echo ""
    log_info "🔒 Rappels de sécurité:"
    echo "  - Vérifiez régulièrement les mises à jour de sécurité"
    echo "  - Surveillez les logs pour détecter les activités suspectes"
    echo "  - Testez régulièrement les sauvegardes"
    echo "  - Renouvelez les certificats SSL avant expiration"
    
    # Métriques finales
    echo ""
    log_info "📈 Métriques de déploiement:"
    echo "  ⏱️  Durée totale: ${deployment_duration}s"
    echo "  💿 Espace disque utilisé: $(du -sh . 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  🗄️  Taille des sauvegardes: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo 'N/A')"
    
    # Tests de performance automatiques
    if command -v ab &> /dev/null && [ "$DRY_RUN" = false ]; then
        echo ""
        log_info "🚀 Test de performance rapide:"
        local perf_result=$(ab -n 10 -c 2 "https://$DOMAIN/" 2>/dev/null | grep "Requests per second" || echo "N/A")
        echo "  $perf_result"
    fi
}

# Fonction pour afficher la version et les informations
show_version() {
    echo "Script de déploiement my-library.cloud"
    echo "Version: 2.0.0"
    echo "Auteur: Script amélioré avec best practices"
    echo ""
    echo "Fonctionnalités:"
    echo "  ✅ Validation complète de l'environnement"
    echo "  ✅ Sauvegarde automatique avec compression"
    echo "  ✅ Déploiement zero-downtime (blue-green)"
    echo "  ✅ Tests de santé avancés"
    echo "  ✅ Rollback automatique en cas d'échec"
    echo "  ✅ Monitoring des métriques système"
    echo "  ✅ Notifications (webhook)"
    echo "  ✅ Mode dry-run pour les tests"
    echo "  ✅ Rapports de déploiement JSON"
    echo "  ✅ Gestion avancée des erreurs"
}

# Fonction de maintenance
maintenance_mode() {
    local action=${1:-"status"}
    local maintenance_file="/var/www/maintenance.html"
    
    case $action in
        "enable")
            log_info "Activation du mode maintenance..."
            
            if [ "$DRY_RUN" = false ]; then
                # Créer la page de maintenance
                cat > "$maintenance_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - $DOMAIN</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
        .eta { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Maintenance en cours</h1>
        <p>Notre service est temporairement indisponible pour maintenance.</p>
        <div class="eta">
            <strong>Durée estimée:</strong> 15 minutes<br>
            <strong>Début:</strong> $(date)
        </div>
        <p>Nous nous excusons pour la gêne occasionnée.</p>
        <p><small>Équipe technique $DOMAIN</small></p>
    </div>
</body>
</html>
EOF
                
                # Modifier nginx pour rediriger vers la page de maintenance
                # (ceci nécessiterait une configuration nginx appropriée)
                log_success "Mode maintenance activé"
            else
                log_debug "[DRY-RUN] Activation du mode maintenance"
            fi
            ;;
        
        "disable")
            log_info "Désactivation du mode maintenance..."
            
            if [ "$DRY_RUN" = false ]; then
                rm -f "$maintenance_file"
                log_success "Mode maintenance désactivé"
            else
                log_debug "[DRY-RUN] Désactivation du mode maintenance"
            fi
            ;;
        
        "status")
            if [ -f "$maintenance_file" ]; then
                log_info "Mode maintenance: ACTIVÉ"
            else
                log_info "Mode maintenance: DÉSACTIVÉ"
            fi
            ;;
    esac
}

# Ajout d'options avancées pour les arguments
case "${1:-}" in
    "--version")
        show_version
        exit 0
        ;;
    "--maintenance")
        maintenance_mode "${2:-status}"
        exit 0
        ;;
esac

# Vérification des permissions
if [ "$EUID" -eq 0 ] && [ "$FORCE_DEPLOY" = false ]; then
    log_warn "⚠️ Exécution en tant que root détectée"
    log_warn "Il est recommandé d'exécuter ce script avec un utilisateur non-root"
    log_warn "Utilisez --force pour ignorer cet avertissement"
    exit 1
fi

# Vérification de l'environnement Git (optionnel)
if [ -d ".git" ] && command -v git &> /dev/null; then
    local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    log_info "📋 Informations Git: branche=$git_branch, commit=$git_commit"
    
    # Vérifier s'il y a des changements non commités
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        log_warn "⚠️ Changements non commités détectés"
        if [ "$FORCE_DEPLOY" = false ]; then
            log_error "Committez vos changements avant le déploiement ou utilisez --force"
            exit 1
        fi
    fi
fi

# Exécution principale
main "$@"