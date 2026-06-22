# FaceCraft Setup Guide

This guide will help you set up and run FaceCraft locally and deploy to AWS EC2.

## Prerequisites

### Local Development
- Node.js 20+ and npm 10+
- MySQL 8+
- Git

### AWS Account (for Production)
- AWS Account with access to:
  - EC2
  - S3
  - Rekognition
  - IAM

## Local Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 2. Set Up MySQL Database

```bash
# Log into MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE facecraft;
CREATE USER 'facecraft'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON facecraft.* TO 'facecraft'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment Variables

```bash
# Copy the example env file for API
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env and update:
DATABASE_URL="mysql://facecraft:password@127.0.0.1:3306/facecraft"
SESSION_SECRET="your-secure-32-character-secret-key-here"
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-bucket-name
REKOGNITION_COLLECTION_ID=facecraft-photos

# For local development with AWS:
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with test data
npm run db:seed
```

### 5. Create AWS Resources (if using AWS features)

```bash
# Create S3 bucket
aws s3 mb s3://facecraft-private-photos --region ap-southeast-1

# Block public access
aws s3api put-public-access-block \
  --bucket facecraft-private-photos \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket facecraft-private-photos \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create Rekognition collection (done automatically by API on first run)
```

### 6. Start Development Servers

```bash
# Start both web and API servers
npm run dev

# Or start individually:
npm run dev:web    # Next.js on http://localhost:3000
npm run dev:api    # Express on http://localhost:4000
```

### 7. Access the Application

- **Home Page**: http://localhost:3000
- **Customer Kiosk**: http://localhost:3000/kiosk
- **Management Login**: http://localhost:3000/login
- **API Health**: http://localhost:4000/api/health

### 8. Test Accounts

After seeding, you can log in with:

- **Super Admin**: superadmin@facecraft.com / password123
- **Admin**: admin@facecraft.com / password123
- **Photographer**: photographer@facecraft.com / password123
- **Staff**: staff@facecraft.com / password123

## Production Deployment to EC2

### 1. Provision EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Recommended: t3.large or larger
# Storage: 50GB+ gp3 volume

# Configure security group:
# Port 22 (SSH) - Your IP only
# Port 80 (HTTP) - 0.0.0.0/0
# Port 443 (HTTPS) - 0.0.0.0/0
```

### 2. Create IAM Instance Role

Create an IAM role with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::facecraft-private-photos",
        "arn:aws:s3:::facecraft-private-photos/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateCollection",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:DeleteFaces",
        "rekognition:ListCollections"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach this role to your EC2 instance.

### 3. Connect and Install Software

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

### 4. Set Up MySQL

```bash
sudo mysql -u root

CREATE DATABASE facecraft;
CREATE USER 'facecraft'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON facecraft.* TO 'facecraft'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Clone and Configure Application

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> facecraft
sudo chown -R ubuntu:ubuntu facecraft
cd facecraft

# Create production .env file
cp apps/api/.env.example apps/api/.env

# Edit with production values
nano apps/api/.env
```

Production `.env` should have:

```env
NODE_ENV=production
API_PORT=4000
APP_URL=https://your-domain.com
API_URL=http://localhost:4000
DATABASE_URL="mysql://facecraft:SECURE_PASSWORD@127.0.0.1:3306/facecraft"
SESSION_SECRET="GENERATE_SECURE_32_CHARACTER_SECRET"
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=facecraft-private-photos
REKOGNITION_COLLECTION_ID=facecraft-photos
PHOTO_RETENTION_DAYS=7
SIGNED_URL_TTL_SECONDS=300
KIOSK_SESSION_TTL_MINUTES=30
```

### 6. Install Dependencies and Build

```bash
npm install
npm run build
```

### 7. Run Migrations and Seed

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

### 8. Configure PM2

```bash
# Start API
pm2 start apps/api/dist/index.js --name facecraft-api

# Start Next.js
pm2 start npm --name facecraft-web -- run start --workspace=apps/web

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### 9. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/facecraft
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/facecraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Set Up HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 11. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 12. Set Up Backup Script

```bash
sudo mkdir -p /var/backups/facecraft
sudo nano /usr/local/bin/facecraft-backup.sh
```

Add backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/facecraft"
DB_NAME="facecraft"

mysqldump -u facecraft -p'SECURE_PASSWORD' $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://your-backup-bucket/

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/facecraft-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/facecraft-backup.sh
```

### 13. Verify Deployment

1. Visit https://your-domain.com
2. Test kiosk flow
3. Log in to management portal
4. Check PM2 status: `pm2 status`
5. Check logs: `pm2 logs`

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check MySQL connection
mysql -u facecraft -p -h 127.0.0.1 facecraft
```

### Database issues

```bash
# Reset and re-run migrations
cd /var/www/facecraft
npm run db:reset
npm run db:seed
```

### AWS permissions issues

Verify the IAM role is attached to the EC2 instance and has correct permissions.

### Port conflicts

```bash
# Check what's using ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :4000
```

## Monitoring

```bash
# View PM2 monitoring dashboard
pm2 monit

# View resource usage
htop

# Check disk space
df -h
```

## Updating the Application

```bash
cd /var/www/facecraft
git pull
npm install
npm run build
npm run db:migrate:deploy
pm2 restart all
```

## Support

For issues or questions, check the logs:

- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- MySQL logs: `/var/log/mysql/`
