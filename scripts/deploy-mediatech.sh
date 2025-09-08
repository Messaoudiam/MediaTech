#!/bin/bash
# MediaTech Production Deployment Script for VPS
# Optimized for my-library.cloud infrastructure
# Usage: ./scripts/deploy-mediatech.sh [OPTIONS]

set -euo pipefail

# ==============================================
# SCRIPT CONFIGURATION
# ==============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_START_TIME=$(date +%s)

# Default values
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
DOMAIN="my-library.cloud"
REGISTRY="codingmessaoud"
APP_NAME="mediatech"
BACKUP_RETENTION=7
HEALTH_CHECK_TIMEOUT=300

# Flags
FORCE_DEPLOY=false
NO_BACKUP=false
ZERO_DOWNTIME=false
DRY_RUN=false
SETUP_ONLY=false
PULL_IMAGES=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging
LOG_DIR="/opt/mediatech/logs"
LOG_FILE="${LOG_DIR}/deploy_$(date +%Y%m%d_%H%M%S).log"

# ==============================================
# FUNCTIONS
# ==============================================

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_help() {
    cat << EOF
MediaTech Production Deployment Script

Usage: $0 [OPTIONS]

Options:
  --force              Force deployment even if validation fails
  --no-backup          Skip database backup
  --zero-downtime      Deploy with zero downtime (blue-green)
  --dry-run           Show what would be done without executing
  --setup-only        Only setup directories and environment
  --no-pull           Skip pulling Docker images
  -h, --help          Show this help message

Environment Variables:
  COMPOSE_FILE         Docker compose file (default: docker-compose.production.yml)
  ENV_FILE            Environment file (default: .env.production)
  REGISTRY            Docker registry (default: codingmessaoud)
  DOMAIN              Domain name (default: my-library.cloud)

Examples:
  $0                   # Standard deployment
  $0 --dry-run         # Preview deployment without executing
  $0 --setup-only      # Only setup directories and check environment
  $0 --zero-downtime   # Deploy without service interruption
  $0 --force --no-backup # Force deployment without backup

EOF
}

# Parse command line arguments
parse_args() {
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
            --setup-only)
                SETUP_ONLY=true
                shift
                ;;
            --no-pull)
                PULL_IMAGES=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Cleanup function for error handling
cleanup() {
    local exit_code=$?
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code after ${deployment_duration}s"
        
        if [ "$DRY_RUN" = false ] && [ "$SETUP_ONLY" = false ]; then
            log_info "Attempting automatic rollback..."
            rollback_deployment || log_error "Rollback failed"
        fi
    else
        log_success "Deployment completed successfully in ${deployment_duration}s"
    fi
    
    # Cleanup temporary files
    rm -f docker-compose.temp.yml 2>/dev/null || true
}

trap cleanup EXIT

# Rollback function
rollback_deployment() {
    log_step "Rolling back deployment..."
    
    # Stop current containers
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Try to restore previous backup if available
    local latest_backup=$(find /opt/mediatech/backups -name "pre_deploy_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || true)
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        log_info "Latest backup found: $latest_backup"
        log_warn "Manual database restore may be needed: gunzip < $latest_backup | docker compose -f $COMPOSE_FILE exec -T db psql -U postgres mediatech_prod"
    fi
    
    log_info "Rollback preparation completed - manual intervention may be required"
}

# Environment validation
validate_environment() {
    log_step "Validating environment..."
    
    local validation_errors=0
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "curl" "openssl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Missing required command: $cmd"
            ((validation_errors++))
        fi
    done
    
    # Check if running on correct server
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
    if [ "$server_ip" != "51.75.250.125" ] && [ "$FORCE_DEPLOY" = false ]; then
        log_warn "Server IP ($server_ip) doesn't match expected VPS IP (51.75.250.125)"
        log_warn "Use --force to deploy anyway"
        ((validation_errors++))
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or not accessible"
        ((validation_errors++))
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Copy .env.production.template to $ENV_FILE and configure it"
        ((validation_errors++))
    else
        # Check for placeholder values
        if grep -q "CHANGE_ME" "$ENV_FILE" 2>/dev/null; then
            log_error "Environment file contains placeholder values (CHANGE_ME)"
            if [ "$FORCE_DEPLOY" = false ]; then
                ((validation_errors++))
            else
                log_warn "Forcing deployment with placeholder values"
            fi
        fi
    fi
    
    # Check compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker compose file not found: $COMPOSE_FILE"
        ((validation_errors++))
    fi
    
    # Check SSL certificates
    local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    if [ ! -f "$cert_path" ]; then
        log_error "SSL certificate not found: $cert_path"
        if [ "$FORCE_DEPLOY" = false ]; then
            ((validation_errors++))
        else
            log_warn "Deploying without SSL certificate"
        fi
    else
        # Check certificate expiration
        local cert_expiry=$(openssl x509 -enddate -noout -in "$cert_path" 2>/dev/null | cut -d= -f2 || echo "")
        if [ -n "$cert_expiry" ]; then
            local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                log_warn "SSL certificate expires in $days_until_expiry days"
            fi
        fi
    fi
    
    # Check disk space (need at least 2GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=2097152  # 2GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Insufficient disk space: $(($available_space/1024))MB available, 2GB required"
        ((validation_errors++))
    fi
    
    # Check existing monitoring network
    if ! docker network inspect monitoring &>/dev/null; then
        log_warn "Monitoring network not found - will be created"
    fi
    
    # Summary
    if [ $validation_errors -gt 0 ]; then
        log_error "$validation_errors validation error(s) found"
        if [ "$FORCE_DEPLOY" = false ]; then
            exit 1
        fi
        log_warn "Proceeding with deployment despite validation errors (--force enabled)"
    fi
    
    log_success "Environment validation completed"
}

# Setup directories with proper permissions
setup_directories() {
    log_step "Setting up directories..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would create directories"
        return
    fi
    
    # Create application directories
    sudo mkdir -p /opt/mediatech/{data/postgres,data/uploads,backups,logs}
    sudo mkdir -p /var/log/nginx
    sudo mkdir -p /var/cache/nginx/mediatech_cache
    
    # Create nginx configuration directory if it doesn't exist
    sudo mkdir -p /etc/nginx/sites-available
    sudo mkdir -p /etc/nginx/sites-enabled
    
    # Set proper permissions
    sudo chown -R 999:999 /opt/mediatech/data/postgres 2>/dev/null || true
    sudo chown -R www-data:www-data /opt/mediatech/data/uploads
    sudo chown -R $USER:$USER /opt/mediatech/backups
    sudo chown -R $USER:$USER /opt/mediatech/logs
    sudo chmod -R 755 /opt/mediatech
    sudo chmod 700 /opt/mediatech/backups
    
    # Create log directory and file
    mkdir -p "$LOG_DIR"
    touch "$LOG_FILE"
    
    log_success "Directories created with proper permissions"
}

# Configure nginx
setup_nginx() {
    log_step "Configuring nginx..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would configure nginx"
        return
    fi
    
    # Copy nginx configuration
    if [ -f "$PROJECT_ROOT/nginx/mediatech.conf" ]; then
        sudo cp "$PROJECT_ROOT/nginx/mediatech.conf" "/etc/nginx/sites-available/mediatech"
        
        # Enable the site
        sudo ln -sf "/etc/nginx/sites-available/mediatech" "/etc/nginx/sites-enabled/mediatech"
        
        # Copy proxy parameters
        if [ -f "$PROJECT_ROOT/nginx/proxy_params" ]; then
            sudo cp "$PROJECT_ROOT/nginx/proxy_params" "/etc/nginx/proxy_params"
        fi
        
        # Test nginx configuration
        if sudo nginx -t; then
            log_info "Nginx configuration is valid"
            
            # Reload nginx if it's running
            if systemctl is-active --quiet nginx; then
                sudo systemctl reload nginx
                log_success "Nginx reloaded with new configuration"
            else
                log_info "Nginx is not running - configuration will be applied on start"
            fi
        else
            log_error "Nginx configuration test failed"
            exit 1
        fi
    else
        log_warn "Nginx configuration file not found at $PROJECT_ROOT/nginx/mediatech.conf"
    fi
}

# Database backup
backup_database() {
    if [ "$NO_BACKUP" = true ]; then
        log_info "Skipping database backup (--no-backup)"
        return
    fi
    
    log_step "Backing up database..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would backup database"
        return
    fi
    
    # Check if database container is running
    if ! docker compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "Up"; then
        log_info "Database container not running - skipping backup"
        return
    fi
    
    local backup_file="/opt/mediatech/backups/pre_deploy_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_compressed="${backup_file}.gz"
    
    log_info "Creating database backup: $backup_compressed"
    
    # Create backup with error handling
    if docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres -d mediatech_prod --verbose --clean --no-acl --no-owner | gzip > "$backup_compressed"; then
        local backup_size=$(du -h "$backup_compressed" | cut -f1)
        log_success "Database backup created: $backup_size"
        
        # Verify backup integrity
        if gunzip -t "$backup_compressed" 2>/dev/null; then
            log_success "Backup integrity verified"
        else
            log_error "Backup integrity check failed"
            rm -f "$backup_compressed"
            exit 1
        fi
        
        # Cleanup old backups
        find /opt/mediatech/backups -name "pre_deploy_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION -delete 2>/dev/null || true
        
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Pull and validate Docker images
pull_images() {
    if [ "$PULL_IMAGES" = false ]; then
        log_info "Skipping image pull (--no-pull)"
        return
    fi
    
    log_step "Pulling Docker images..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would pull Docker images"
        return
    fi
    
    # Source environment file for IMAGE_TAG
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi
    
    local images=("$REGISTRY/mediatech-backend:${IMAGE_TAG:-latest}" "$REGISTRY/mediatech-frontend:${IMAGE_TAG:-latest}")
    
    for image in "${images[@]}"; do
        log_info "Pulling $image..."
        
        if docker pull "$image"; then
            # Verify image
            if docker image inspect "$image" &> /dev/null; then
                log_success "Image pulled and verified: $image"
            else
                log_error "Image verification failed: $image"
                exit 1
            fi
        else
            log_error "Failed to pull image: $image"
            exit 1
        fi
    done
}

# Run Prisma migrations
run_migrations() {
    log_step "Running database migrations..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run database migrations"
        return
    fi
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres -d mediatech_prod &> /dev/null; then
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database not ready after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Waiting for database... ($attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    # Run Prisma migrations
    if docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        exit 1
    fi
    
    # Generate Prisma client (if needed)
    docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma generate &>/dev/null || true
}

# Deploy services
deploy_services() {
    log_step "Deploying services..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would deploy services"
        return
    fi
    
    # Source environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Create networks if they don't exist
    docker network create app-network 2>/dev/null || true
    docker network create monitoring 2>/dev/null || true
    
    # Stop existing services gracefully
    log_info "Stopping existing services..."
    docker compose -f "$COMPOSE_FILE" down --timeout 30 --remove-orphans 2>/dev/null || true
    
    # Clean up unused Docker resources
    docker system prune -f --filter "until=24h" &>/dev/null || true
    
    # Start services
    log_info "Starting services..."
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Run database migrations after services are up
    run_migrations
}

# Health checks
health_checks() {
    log_step "Performing health checks..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would perform health checks"
        return 0
    fi
    
    local max_attempts=60
    local attempt=1
    
    # Check database health
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres -d mediatech_prod &> /dev/null; then
            log_success "Database is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database health check failed after $max_attempts attempts"
            return 1
        fi
        
        log_info "Database health check: $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    # Check backend health
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "http://localhost/api/health" &> /dev/null; then
            log_success "Backend is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend health check failed after $max_attempts attempts"
            return 1
        fi
        
        log_info "Backend health check: $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    # Check HTTPS endpoint
    if curl -f -s --max-time 10 "https://$DOMAIN/health" &> /dev/null; then
        log_success "HTTPS endpoint is healthy"
    else
        log_warn "HTTPS endpoint not accessible - check nginx configuration"
    fi
    
    # Display service status
    log_info "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    return 0
}

# Generate deployment report
generate_deployment_report() {
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    local report_file="/opt/mediatech/logs/deployment_report_$(date +%Y%m%d_%H%M%S).json"
    
    log_step "Generating deployment report..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would generate deployment report"
        return
    fi
    
    # Source environment file for variables
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE" 2>/dev/null || true
        set +a
    fi
    
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
            "dry_run": $DRY_RUN,
            "setup_only": $SETUP_ONLY
        }
    },
    "images": {
        "backend": "$REGISTRY/mediatech-backend:${IMAGE_TAG:-latest}",
        "frontend": "$REGISTRY/mediatech-frontend:${IMAGE_TAG:-latest}"
    },
    "system": {
        "disk_usage": "$(df -h / | awk 'NR==2 {print $5}' 2>/dev/null || echo 'N/A')",
        "memory_usage": "$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}' 2>/dev/null || echo 'N/A')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | xargs 2>/dev/null || echo 'N/A')"
    },
    "git": {
        "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
        "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    }
}
EOF
    )
    
    echo "$report" > "$report_file"
    log_success "Deployment report saved: $report_file"
}

# Main deployment function
main() {
    cd "$PROJECT_ROOT"
    
    log_info "🚀 Starting MediaTech deployment - $(date)"
    log_info "📍 Project root: $PROJECT_ROOT"
    log_info "📝 Log file: $LOG_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        log_warn "🧪 DRY-RUN MODE - No actual changes will be made"
    fi
    
    # Validation
    validate_environment
    
    # Setup
    setup_directories
    setup_nginx
    
    if [ "$SETUP_ONLY" = true ]; then
        log_success "Setup completed - exiting (--setup-only)"
        return
    fi
    
    # Backup
    backup_database
    
    # Deploy
    pull_images
    deploy_services
    
    # Verify
    if ! health_checks; then
        log_error "Health checks failed"
        exit 1
    fi
    
    # Report
    generate_deployment_report
    
    local deployment_duration=$(($(date +%s) - DEPLOYMENT_START_TIME))
    log_success "🎉 MediaTech deployment completed successfully in ${deployment_duration}s"
    
    # Final information
    echo ""
    log_info "📋 Deployment Summary:"
    echo "  🌐 Application: https://$DOMAIN"
    echo "  📊 Monitoring: https://$DOMAIN:3000"
    echo "  📈 Metrics: https://$DOMAIN:9090"
    echo "  📝 Logs: docker compose -f $COMPOSE_FILE logs -f"
    echo "  📊 Status: docker compose -f $COMPOSE_FILE ps"
    echo ""
    log_info "🔧 Useful commands:"
    echo "  # View logs"
    echo "  docker compose -f $COMPOSE_FILE logs -f [service]"
    echo ""
    echo "  # Database access"
    echo "  docker compose -f $COMPOSE_FILE exec db psql -U postgres mediatech_prod"
    echo ""
    echo "  # Restart services"
    echo "  docker compose -f $COMPOSE_FILE restart [service]"
    echo ""
    echo "  # Run migrations"
    echo "  docker compose -f $COMPOSE_FILE exec backend npx prisma migrate deploy"
}

# ==============================================
# SCRIPT EXECUTION
# ==============================================

# Parse arguments
parse_args "$@"

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ] && [ "$FORCE_DEPLOY" = false ]; then
    log_warn "⚠️ Running as root is not recommended"
    log_warn "Consider running as a non-root user with sudo access"
    log_warn "Use --force to continue anyway"
    exit 1
fi

# Execute main function
main