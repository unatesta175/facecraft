#!/bin/bash

set -e

echo "🚀 Starting FaceCraft deployment..."

# Configuration
APP_DIR="/var/www/facecraft"
NODE_ENV="production"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Pull latest code
print_status "Pulling latest code from repository..."
git pull origin main || {
    print_error "Failed to pull latest code"
    exit 1
}

# Install dependencies
print_status "Installing dependencies..."
npm install --production=false || {
    print_error "Failed to install dependencies"
    exit 1
}

# Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate || {
    print_error "Failed to generate Prisma client"
    exit 1
}

# Run database migrations
print_status "Running database migrations..."
npm run db:migrate:deploy || {
    print_error "Failed to run migrations"
    exit 1
}

# Build applications
print_status "Building applications..."
npm run build || {
    print_error "Failed to build applications"
    exit 1
}

# Restart PM2 processes
print_status "Restarting PM2 processes..."
pm2 restart facecraft-api facecraft-web || {
    print_error "Failed to restart PM2 processes"
    exit 1
}

# Wait a moment for services to start
sleep 3

# Health check
print_status "Performing health check..."
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    print_status "API health check passed"
else
    print_warning "API health check failed - check logs with: pm2 logs facecraft-api"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Web health check passed"
else
    print_warning "Web health check failed - check logs with: pm2 logs facecraft-web"
fi

# Show PM2 status
print_status "Deployment complete! Current status:"
pm2 status

echo ""
print_status "Deployment finished successfully!"
print_warning "Monitor logs with: pm2 logs"
print_warning "View monitoring dashboard with: pm2 monit"
