#!/bin/bash

set -e

echo "Starting FaceCraft deployment..."

APP_DIR="${APP_DIR:-/var/www/facecraft}"
NODE_ENV="${NODE_ENV:-production}"
RUN_DB_MIGRATIONS="${RUN_DB_MIGRATIONS:-true}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

if [ ! -f "package.json" ]; then
    print_error "package.json not found in $APP_DIR"
    exit 1
fi

print_status "Syncing code from origin/main..."
git fetch origin main
rm -f apps/api/tsconfig.tsbuildinfo packages/contracts/tsconfig.tsbuildinfo 2>/dev/null || true
git reset --hard origin/main
git clean -fd

print_status "Installing dependencies..."
npm install --production=false

print_status "Generating Prisma client..."
npm run db:generate

if [ "$RUN_DB_MIGRATIONS" = "true" ]; then
    print_status "Running database migrations..."
    if npm run db:migrate:deploy; then
        print_status "Database migrations applied"
    else
        print_warning "Database migrations failed or were skipped (see P3005 baseline note in workflow docs)"
    fi
else
    print_warning "Skipping database migrations (RUN_DB_MIGRATIONS=false)"
fi

print_status "Building applications..."
npm run build --workspace=packages/contracts
npm run build --workspace=apps/api
npm run build --workspace=apps/web

print_status "Reloading PM2 processes..."
if [ -f "infrastructure/pm2/ecosystem.config.cjs" ]; then
    pm2 startOrReload infrastructure/pm2/ecosystem.config.cjs --update-env
else
    pm2 restart facecraft-api facecraft-web
fi

sleep 3

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

print_status "Deployment complete. Current status:"
pm2 status

print_status "Monitor logs with: pm2 logs"
