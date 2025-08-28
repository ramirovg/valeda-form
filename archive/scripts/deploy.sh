#!/bin/bash
# Valeda Form Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="valeda-form-api"
REMOTE_USER="root"
REMOTE_HOST="104.248.69.154"
REMOTE_PATH="/var/www/oftalmonet.mx/valeda"
LOCAL_BUILD_DIR="dist/valeda-form"
BACKUP_DIR="/var/backups/valeda-form"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    error "Invalid environment. Use 'production' or 'staging'"
fi

log "Starting deployment to $ENVIRONMENT environment..."

# Step 1: Pre-deployment checks
log "Running pre-deployment checks..."

if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

if [[ ! -f "package.json" ]]; then
    error "package.json not found. Are you in the project root?"
fi

# Step 2: Install dependencies
log "Installing dependencies..."
npm install --only=prod

# Step 3: Build application
log "Building application for $ENVIRONMENT..."
npm run build:production

if [[ ! -d "$LOCAL_BUILD_DIR" ]]; then
    error "Build directory not found: $LOCAL_BUILD_DIR"
fi

success "Application built successfully"

# Step 4: Create deployment package
log "Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${APP_NAME}_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"

tar -czf "$PACKAGE_NAME" \
    $LOCAL_BUILD_DIR \
    server-production.js \
    ecosystem.config.js \
    package.json \
    package-lock.json \
    .env.template \
    nginx/

success "Deployment package created: $PACKAGE_NAME"

# Step 5: Transfer to server
log "Transferring files to server..."

# Create backup on server
ssh "$REMOTE_USER@$REMOTE_HOST" "
    if [[ -d '$REMOTE_PATH' ]]; then
        sudo mkdir -p '$BACKUP_DIR'
        sudo cp -r '$REMOTE_PATH' '$BACKUP_DIR/backup_$TIMESTAMP'
        echo 'Backup created: $BACKUP_DIR/backup_$TIMESTAMP'
    fi
"

# Upload new version
scp "$PACKAGE_NAME" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

success "Files transferred successfully"

# Step 6: Deploy on server
log "Deploying on server..."

ssh "$REMOTE_USER@$REMOTE_HOST" "
    set -e

    # Extract new version
    cd /tmp
    tar -xzf '$PACKAGE_NAME'

    # Stop existing services
    if command -v pm2 &> /dev/null; then
        pm2 stop $APP_NAME || echo 'App not running'
    fi

    # Create directory structure
    sudo mkdir -p '$REMOTE_PATH'

    # Deploy new version
    sudo cp -r $LOCAL_BUILD_DIR/* '$REMOTE_PATH/'
    sudo cp server-production.js '$REMOTE_PATH/'
    sudo cp ecosystem.config.js '$REMOTE_PATH/'
    sudo cp package*.json '$REMOTE_PATH/'

    # Set permissions
    sudo chown -R www-data:www-data '$REMOTE_PATH'
    sudo chmod -R 755 '$REMOTE_PATH'

    # Install production dependencies
    cd '$REMOTE_PATH'
    sudo -u www-data npm install --only=prod

    # Start services
    if command -v pm2 &> /dev/null; then
        sudo -u www-data pm2 start ecosystem.config.js --env $ENVIRONMENT
        sudo -u www-data pm2 save
    else
        echo 'PM2 not found. Start manually: node server-production.js'
    fi

    # Cleanup
    rm -f /tmp/$PACKAGE_NAME
    rm -rf /tmp/$LOCAL_BUILD_DIR

    echo 'Deployment completed successfully!'
"

# Step 7: Verify deployment
log "Verifying deployment..."

sleep 5  # Wait for services to start

# Check if API is responding
if curl -f -s "http://$REMOTE_HOST:3001/health" > /dev/null; then
    success "API health check passed"
else
    warning "API health check failed. Check logs on server."
fi

# Cleanup local files
rm -f "$PACKAGE_NAME"

success "Deployment to $ENVIRONMENT completed successfully!"

log "Next steps:"
echo "1. Update your Nginx configuration on the server"
echo "2. Test the application at https://oftalmonet.mx/valeda/"
echo "3. Monitor logs: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs $APP_NAME'"

# Optional: Open application in browser
if command -v xdg-open &> /dev/null; then
    log "Opening application..."
    xdg-open "https://oftalmonet.mx/valeda/"
elif command -v open &> /dev/null; then
    log "Opening application..."
    open "https://oftalmonet.mx/valeda/"
fi
