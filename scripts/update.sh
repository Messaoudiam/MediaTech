#!/bin/bash
# MediaTech Git Update Script
# Usage: ./scripts/update.sh [environment] [branch]
# Example: ./scripts/update.sh production main

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV="${1:-production}"
BRANCH="${2:-main}"

echo "🔄 MediaTech Git Update Script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Change to project root
cd "$PROJECT_ROOT"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_error "Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
log_step "Checking for local changes..."
if ! git diff --quiet || ! git diff --staged --quiet; then
    log_warn "Uncommitted changes detected"
    
    # Show the changes
    git status --porcelain
    
    # Ask user what to do
    read -p "Stash changes before update? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Stashing changes..."
        git stash push -m "Auto-stash before update $(date '+%Y-%m-%d %H:%M:%S')"
    else
        log_error "Please commit or stash your changes before updating"
        exit 1
    fi
fi

# Check current branch
current_branch=$(git branch --show-current)
log_info "Current branch: $current_branch"

# Fetch latest changes
log_step "Fetching latest changes from origin..."
git fetch origin

# Check if branch exists
if ! git show-ref --verify --quiet refs/remotes/origin/$BRANCH; then
    log_error "Branch '$BRANCH' does not exist on remote"
    exit 1
fi

# Switch to target branch if different
if [ "$current_branch" != "$BRANCH" ]; then
    log_step "Switching to branch: $BRANCH"
    git checkout "$BRANCH"
fi

# Check if we're behind
behind=$(git rev-list --count HEAD..origin/$BRANCH)
if [ "$behind" -eq 0 ]; then
    log_info "Already up to date"
else
    log_info "$behind commits behind origin/$BRANCH"
    
    # Show what will be updated
    log_info "Changes to be pulled:"
    git log --oneline HEAD..origin/$BRANCH | head -10
    
    if [ "$behind" -gt 10 ]; then
        log_info "... and $((behind - 10)) more commits"
    fi
    
    # Pull changes
    log_step "Pulling changes from origin/$BRANCH..."
    git pull origin "$BRANCH"
    
    log_info "✅ Code updated successfully"
fi

# Check if Docker images need to be rebuilt
if git diff HEAD~1 HEAD --name-only | grep -E "(Dockerfile|package\.json|package-lock\.json)" > /dev/null; then
    log_warn "Docker-related files changed, rebuilding images recommended"
    REBUILD_IMAGES=true
else
    REBUILD_IMAGES=false
fi

# Deploy the updated application
log_step "Deploying updated application..."

if [ "$REBUILD_IMAGES" = true ]; then
    log_info "Rebuilding and deploying with new images..."
    "$SCRIPT_DIR/deploy.sh" "$ENV" deploy
else
    log_info "Deploying without rebuilding images..."
    "$SCRIPT_DIR/deploy.sh" "$ENV" deploy
fi

# Restore stashed changes if any
if git stash list | grep -q "Auto-stash before update"; then
    log_step "Restoring stashed changes..."
    read -p "Restore stashed changes? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if git stash pop; then
            log_info "✅ Stashed changes restored"
        else
            log_warn "⚠️ Conflicts while restoring stash, please resolve manually"
        fi
    fi
fi

# Final status
log_info "✅ Update completed successfully!"
log_info "Current commit: $(git rev-parse --short HEAD)"
log_info "Application is running in $ENV environment"

# Show deployment status
log_step "Checking deployment status..."
"$SCRIPT_DIR/deploy.sh" "$ENV" health 