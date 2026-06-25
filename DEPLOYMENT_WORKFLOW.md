# Deployment Workflow: Push to EC2

Quick guide to deploy code changes to EC2.

## Prerequisites

- Code is already deployed once on EC2
- PM2 is running `facecraft-api` and `facecraft-web`

## Steps

### 1. Push Changes to GitHub

```powershell
# On your Windows computer
cd C:\Users\User\facecraft

git add .
git commit -m "Describe your changes"
git push origin main
```

### 2. SSH into EC2

```powershell
ssh -i "C:\Users\User\Downloads\facecraft-key.pem" ubuntu@54.255.93.4
```

Replace `54.255.93.4` with your Elastic IP.

### 3. Pull and Rebuild on EC2

```bash
cd /var/www/facecraft
git pull origin main
npm install --production=false
npm run db:generate
npm run db:migrate:deploy --workspace=apps/api
npm run build
pm2 restart facecraft-api facecraft-web
```

### 4. Verify

```bash
pm2 status
pm2 logs --lines 50
```

Visit `http://YOUR_ELASTIC_IP` in browser to test.

## Quick Restart (no code changes)

If you only changed `.env` or need to restart:

```bash
pm2 restart facecraft-api facecraft-web
```

## View Logs

```bash
pm2 logs facecraft-api
pm2 logs facecraft-web
pm2 logs  # both
```

## Rollback

```bash
cd /var/www/facecraft
git log --oneline  # find previous commit hash
git reset --hard COMMIT_HASH
npm run build
pm2 restart all
```

---

**Tip**: If SSH times out, check your Security Group allows port 22 from your current IP.
