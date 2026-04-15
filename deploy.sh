#!/bin/bash

# Simple deployment script for Todo App
# Usage: ./deploy.sh [environment] [version]

set -e  # Exit on any error

# Default values
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
APP_NAME="todo-app"
DEPLOY_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of ${APP_NAME} v${VERSION} to ${ENVIRONMENT}${NC}"

# Configuration based on environment
case $ENVIRONMENT in
    "production")
        DEPLOY_PATH="/var/www/todo-app/production"
        BACKUP_PATH="/var/www/todo-app/backups"
        SERVICE_NAME="todo-app-prod"
        HEALTH_URL="http://production.example.com"
        ;;
    "staging")
        DEPLOY_PATH="/var/www/todo-app/staging"
        BACKUP_PATH="/var/www/todo-app/staging-backups"
        SERVICE_NAME="todo-app-staging"
        HEALTH_URL="http://staging.example.com"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: ${ENVIRONMENT}${NC}"
        echo "Supported environments: production, staging"
        exit 1
        ;;
esac

# Function to create backup
create_backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    
    if [ -d "$DEPLOY_PATH" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="${BACKUP_PATH}/backup_${TIMESTAMP}"
        
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_PATH"/* "$BACKUP_DIR/" 2>/dev/null || echo "No files to backup"
        
        echo -e "${GREEN}✅ Backup created at ${BACKUP_DIR}${NC}"
    else
        echo -e "${YELLOW}⚠️  No previous deployment found, skipping backup${NC}"
    fi
}

# Function to extract deployment package
extract_package() {
    echo -e "${YELLOW}📂 Extracting deployment package...${NC}"
    
    # Create deployment directory
    mkdir -p "$DEPLOY_PATH"
    
    # Extract the tar.gz file
    if [ -f "${APP_NAME}-build-${BUILD_NUMBER}.tar.gz" ]; then
        tar -xzf "${APP_NAME}-build-${BUILD_NUMBER}.tar.gz" -C "$DEPLOY_PATH"
        echo -e "${GREEN}✅ Package extracted successfully${NC}"
    else
        echo -e "${RED}❌ Deployment package not found: ${APP_NAME}-build-${BUILD_NUMBER}.tar.gz${NC}"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing production dependencies...${NC}"
    
    cd "$DEPLOY_PATH"
    
    # Install only production dependencies
    npm ci --only=production --silent
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to update configuration
update_config() {
    echo -e "${YELLOW}⚙️  Updating configuration for ${ENVIRONMENT}...${NC}"
    
    cd "$DEPLOY_PATH"
    
    # Create environment-specific config
    cat > config.json << EOF
{
    "environment": "${ENVIRONMENT}",
    "port": ${DEPLOY_PORT},
    "version": "${VERSION}",
    "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "buildNumber": "${BUILD_NUMBER:-unknown}"
}
EOF
    
    echo -e "${GREEN}✅ Configuration updated${NC}"
}

# Function to start/restart service
restart_service() {
    echo -e "${YELLOW}🔄 Restarting ${SERVICE_NAME} service...${NC}"
    
    # Stop existing service (if running)
    pkill -f "http-server.*${DEPLOY_PORT}" || true
    sleep 2
    
    # Start new service
    cd "$DEPLOY_PATH"
    nohup npm start > /var/log/${SERVICE_NAME}.log 2>&1 &
    
    # Save PID for future reference
    echo $! > "/var/run/${SERVICE_NAME}.pid"
    
    echo -e "${GREEN}✅ Service restarted${NC}"
}

# Function to perform health check
health_check() {
    echo -e "${YELLOW}🏥 Performing health check...${NC}"
    
    # Wait for service to start
    sleep 5
    
    # Check if service is responding
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f -s "http://localhost:${DEPLOY_PORT}" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed - service is responding${NC}"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -e "${YELLOW}⏳ Attempt ${ATTEMPT}/${MAX_ATTEMPTS} - waiting for service...${NC}"
        sleep 2
    done
    
    echo -e "${RED}❌ Health check failed - service not responding after ${MAX_ATTEMPTS} attempts${NC}"
    return 1
}

# Function to run smoke tests
smoke_tests() {
    echo -e "${YELLOW}🧪 Running smoke tests...${NC}"
    
    # Basic smoke tests
    local base_url="http://localhost:${DEPLOY_PORT}"
    
    # Test 1: Home page loads
    if curl -f -s "${base_url}" | grep -q "My Todo App"; then
        echo -e "${GREEN}✅ Home page loads correctly${NC}"
    else
        echo -e "${RED}❌ Home page test failed${NC}"
        return 1
    fi
    
    # Test 2: Static assets load
    if curl -f -s "${base_url}/styles.css" > /dev/null; then
        echo -e "${GREEN}✅ CSS loads correctly${NC}"
    else
        echo -e "${RED}❌ CSS test failed${NC}"
        return 1
    fi
    
    # Test 3: JavaScript files load
    if curl -f -s "${base_url}/src/app.js" > /dev/null; then
        echo -e "${GREEN}✅ JavaScript loads correctly${NC}"
    else
        echo -e "${RED}❌ JavaScript test failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All smoke tests passed${NC}"
}

# Function to rollback on failure
rollback() {
    echo -e "${RED}🔙 Rolling back deployment...${NC}"
    
    # Find latest backup
    LATEST_BACKUP=$(find "$BACKUP_PATH" -name "backup_*" -type d | sort -r | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        echo -e "${YELLOW}📦 Restoring from backup: ${LATEST_BACKUP}${NC}"
        
        # Remove current deployment
        rm -rf "$DEPLOY_PATH"/*
        
        # Restore from backup
        cp -r "$LATEST_BACKUP"/* "$DEPLOY_PATH/"
        
        # Restart service
        restart_service
        
        echo -e "${GREEN}✅ Rollback completed${NC}"
    else
        echo -e "${RED}❌ No backup found for rollback${NC}"
    fi
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    echo -e "${GREEN}📢 Notification: ${status} - ${message}${NC}"
    
    # Add actual notification logic here (Slack, email, etc.)
    # Example:
    # curl -X POST -H 'Content-type: application/json' \
    #      --data "{\"text\":\"${APP_NAME} deployment ${status}: ${message}\"}" \
    #      $SLACK_WEBHOOK_URL
}

# Main deployment process
main() {
    echo -e "${GREEN}🎯 Target Environment: ${ENVIRONMENT}${NC}"
    echo -e "${GREEN}📦 Version: ${VERSION}${NC}"
    echo -e "${GREEN}📁 Deploy Path: ${DEPLOY_PATH}${NC}"
    
    # Trap to handle script interruption
    trap 'echo -e "${RED}🛑 Deployment interrupted${NC}"; rollback; exit 1' INT TERM
    
    # Deployment steps
    create_backup
    extract_package
    install_dependencies
    update_config
    restart_service
    
    # Validation steps
    if health_check && smoke_tests; then
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
        send_notification "SUCCESS" "Deployment of ${APP_NAME} v${VERSION} to ${ENVIRONMENT} completed"
        
        # Cleanup old backups (keep last 5)
        find "$BACKUP_PATH" -name "backup_*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
        
        exit 0
    else
        echo -e "${RED}❌ Deployment validation failed${NC}"
        rollback
        send_notification "FAILED" "Deployment of ${APP_NAME} v${VERSION} to ${ENVIRONMENT} failed and was rolled back"
        exit 1
    fi
}

# Check if running as root for production
if [ "$ENVIRONMENT" = "production" ] && [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Production deployment must run as root${NC}"
    exit 1
fi

# Run main deployment
main "$@"