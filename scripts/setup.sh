#!/bin/bash

# AI Coding Book Setup Script
# This script sets up the development environment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current: $(node -v)"
    fi
    
    log "Node.js version: $(node -v) ✓"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    log "npm version: $(npm -v) ✓"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm install
    log "Dependencies installed successfully ✓"
}

# Setup environment file
setup_environment() {
    if [[ ! -f ".env.local" ]]; then
        if [[ -f ".env.example" ]]; then
            log "Creating .env.local from template..."
            cp .env.example .env.local
            warning "Please edit .env.local and add your Gemini API key!"
            info "You need to get a Gemini API key from: https://makersuite.google.com/app/apikey"
        else
            error ".env.example file not found!"
        fi
    else
        info ".env.local already exists ✓"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p src/data
    mkdir -p logs
    mkdir -p backups
    log "Directories created ✓"
}

# Setup database permissions
setup_database() {
    log "Setting up database permissions..."
    chmod 755 src/data 2>/dev/null || true
    log "Database setup complete ✓"
}

# Install global tools (optional)
install_global_tools() {
    read -p "Install global development tools (PM2, Vercel CLI)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Installing global tools..."
        
        # PM2 for process management
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
            log "PM2 installed ✓"
        else
            info "PM2 already installed ✓"
        fi
        
        # Vercel CLI for easy deployment
        if ! command -v vercel &> /dev/null; then
            npm install -g vercel
            log "Vercel CLI installed ✓"
        else
            info "Vercel CLI already installed ✓"
        fi
    fi
}

# Verify setup
verify_setup() {
    log "Verifying setup..."
    
    # Check if all required files exist
    local required_files=(
        "package.json"
        "next.config.js"
        "tailwind.config.js"
        "tsconfig.json"
        ".env.local"
        "src/app/page.tsx"
        "src/lib/database.ts"
        "src/lib/gemini.ts"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            info "$file ✓"
        else
            error "$file not found!"
        fi
    done
    
    # Check if node_modules exists
    if [[ -d "node_modules" ]]; then
        info "node_modules ✓"
    else
        error "node_modules not found! Run 'npm install'"
    fi
    
    log "Setup verification complete ✓"
}

# Display next steps
show_next_steps() {
    echo
    log "🎉 Setup completed successfully!"
    echo
    info "Next steps:"
    echo "1. Edit .env.local and add your Gemini API key"
    echo "2. Run 'npm run dev' to start development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo
    info "Useful commands:"
    echo "• npm run dev          - Start development server"
    echo "• npm run build        - Build for production"
    echo "• npm run start        - Start production server"
    echo "• npm run lint         - Run linting"
    echo "• npm run type-check   - Check TypeScript types"
    echo
    info "Deployment:"
    echo "• ./scripts/deploy.sh docker      - Deploy with Docker"
    echo "• ./scripts/deploy.sh production  - Deploy to production"
    echo "• vercel                          - Deploy to Vercel"
    echo
    info "For more information, see README.md and DEPLOYMENT.md"
    echo
}

# Main setup function
main() {
    log "Starting AI Coding Book setup..."
    echo
    
    check_node
    check_npm
    create_directories
    setup_environment
    install_dependencies
    setup_database
    install_global_tools
    verify_setup
    show_next_steps
}

# Run setup
main "$@"