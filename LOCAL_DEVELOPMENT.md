# Local Development: Build and Run

Quick guide to run FaceCraft locally after making code changes.

## Prerequisites

- MySQL is running locally
- `.env` files exist in `apps/api/` and `apps/web/`

## First Time Setup

```powershell
cd C:\Users\User\facecraft

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

## Run After Code Changes

### Option A: Development Mode (Hot Reload)

```powershell
npm run dev
```

This starts:
- API on `http://localhost:4000`
- Web on `http://localhost:3000`

Changes auto-reload. Press `Ctrl+C` to stop.

### Option B: Production Mode (Full Build)

```powershell
# Build everything
npm run build

# Start API
npm run start --workspace=apps/api

# In another terminal, start web
npm run start --workspace=apps/web
```

## After Database Schema Changes

If you modified `apps/api/prisma/schema.prisma`:

```powershell
npm run db:generate
npm run db:migrate
```

Then restart the dev server.

## Reset Database

```powershell
npm run db:reset --workspace=apps/api
npm run db:seed
```

**Warning**: This deletes all data.

## Check If Services Are Running

### API Health Check

Visit: `http://localhost:4000/api/health`

### Web

Visit: `http://localhost:3000`

## Common Issues

### Port Already in Use

Kill existing processes:

```powershell
# Find process on port 4000
netstat -ano | findstr :4000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Error

Check:
1. MySQL is running: `Get-Service MySQL*`
2. `.env` has correct `DATABASE_URL`
3. Database exists: `mysql -u root -p` then `SHOW DATABASES;`

---

**Tip**: Use `npm run dev` for daily development. Only use production builds when testing deployment-like behavior.
