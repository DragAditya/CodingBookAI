#!/bin/bash

# AI Coding Book Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e  # Exit on any error

# Configuration
APP_NAME="ai-coding-book"
DOCKER_IMAGE="ai-coding-book"
BACKUP_DIR="backups"
LOG_FILE="deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This may cause permission issues."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current version: $(node -v)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    # Check if .env file exists
    if [[ ! -f ".env.local" && ! -f ".env.production" ]]; then
        warning "No environment file found. Creating .env.local from template..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env.local
            warning "Please edit .env.local with your configuration before continuing."
            read -p "Press Enter to continue after editing .env.local..."
        else
            error "No .env.example file found. Please create environment configuration."
        fi
    fi
    
    log "Prerequisites check completed."
}

# Backup database
backup_database() {
    if [[ -f "src/data/questions.db" ]]; then
        log "Creating database backup..."
        mkdir -p $BACKUP_DIR
        BACKUP_NAME="questions-$(date +%Y%m%d-%H%M%S).db"
        cp src/data/questions.db "$BACKUP_DIR/$BACKUP_NAME"
        log "Database backed up to $BACKUP_DIR/$BACKUP_NAME"
        
        # Keep only last 10 backups
        ls -t $BACKUP_DIR/questions-*.db | tail -n +11 | xargs rm -f 2>/dev/null || true
        log "Old backups cleaned up (keeping 10 most recent)"
    else
        info "No existing database found. Skipping backup."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --only=production
    log "Dependencies installed successfully."
}

# Build application
build_application() {
    log "Building application..."
    npm run build
    log "Application built successfully."
}

# Development deployment
deploy_development() {
    log "Starting development deployment..."
    check_prerequisites
    npm install
    log "Starting development server..."
    npm run dev
}

# Production deployment (local)
deploy_production_local() {
    log "Starting production deployment (local)..."
    check_prerequisites
    backup_database
    install_dependencies
    build_application
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        log "Using PM2 for process management..."
        
        # Stop existing process
        pm2 stop $APP_NAME 2>/dev/null || true
        pm2 delete $APP_NAME 2>/dev/null || true
        
        # Start new process
        pm2 start npm --name $APP_NAME -- start
        pm2 save
        
        log "Application started with PM2."
        pm2 status
    else
        log "PM2 not found. Starting with npm..."
        npm start
    fi
}

# Docker deployment
deploy_docker() {
    log "Starting Docker deployment..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed."
    fi
    
    backup_database
    
    log "Building Docker image..."
    docker-compose build
    
    log "Starting services..."
    docker-compose up -d
    
    log "Docker deployment completed."
    docker-compose ps
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log "✅ Health check passed - Application is running"
        
        # Display application info
        echo
        info "Application Information:"
        info "- URL: http://localhost:3000"
        info "- Health Check: http://localhost:3000/health"
        info "- Metrics: http://localhost:3000/metrics"
        info "- Logs: $LOG_FILE"
        echo
    else
        error "❌ Health check failed - Application is not responding"
    fi
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    if command -v pm2 &> /dev/null; then
        pm2 restart $APP_NAME
    elif command -v docker-compose &> /dev/null; then
        docker-compose restart
    fi
    
    log "Rollback completed."
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Clean npm cache
    npm cache clean --force 2>/dev/null || true
    
    # Clean Docker if used
    if command -v docker &> /dev/null; then
        docker system prune -f 2>/dev/null || true
    fi
    
    log "Cleanup completed."
}

# Main deployment logic
main() {
    local environment=${1:-production}
    
    log "Starting deployment for environment: $environment"
    
    case $environment in
        "development" | "dev")
            deploy_development
            ;;
        "production" | "prod")
            deploy_production_local
            health_check
            ;;
        "docker")
            deploy_docker
            health_check
            ;;
        "rollback")
            rollback
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 [development|production|docker|rollback|cleanup]"
            echo
            echo "Environments:"
            echo "  development  - Start development server"
            echo "  production   - Deploy for production (local)"
            echo "  docker       - Deploy using Docker"
            echo "  rollback     - Rollback to previous version"
            echo "  cleanup      - Clean up temporary files"
            exit 1
            ;;
    esac
}

# Trap errors and cleanup
trap 'error "Deployment failed. Check $LOG_FILE for details."' ERR

# Check permissions
check_permissions

# Run main function
main "$@"

log "Deployment completed successfully! 🎉"