# FaceCraft EC2 Deployment Guide

Complete guide to deploy FaceCraft to AWS EC2.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Domain name (optional, but recommended for HTTPS)

## Step 0: Prepare How EC2 Will Receive Your Code

Before you run any EC2 setup or deployment commands, decide how your project files will get onto the EC2 server.

### Option A: Use GitHub Repository (Recommended)

Use this option if you want to run commands like:

```bash
wget https://raw.githubusercontent.com/<github-username>/<repo-name>/main/infrastructure/scripts/ec2-setup.sh
git clone https://github.com/<github-username>/<repo-name>.git .
```

Before running those commands, you must already have:

- A GitHub account
- A GitHub repository created for this project
- This local `facecraft` folder pushed to that repository
- The repository branch name confirmed, usually `main`

Example values:

- GitHub username: `your-github-username`
- Repository name: `facecraft`
- Branch: `main`

Then your setup script URL becomes:

```bash
wget https://raw.githubusercontent.com/your-github-username/facecraft/main/infrastructure/scripts/ec2-setup.sh
```

And your clone command becomes:

```bash
git clone https://github.com/your-github-username/facecraft.git .
```

If your repository is private, you must configure GitHub authentication on EC2 first, or use the manual copy option below.

### Option B: Manually Copy Files to EC2

Use this option if you do not want to use GitHub yet.

You will manually copy:

- `infrastructure/scripts/ec2-setup.sh` to the EC2 server before Step 3.2
- The full FaceCraft project folder to `/var/www/facecraft` before Step 4.2

This guide mainly uses the GitHub option because it is easier to repeat when you update the app.

## Step 1: Create AWS Resources

### 1.1 Create S3 Bucket

```powershell
# Create bucket
aws s3 mb s3://facecraft-private-photos --region ap-southeast-1

# Block all public access
aws s3api put-public-access-block --bucket facecraft-private-photos --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption --bucket facecraft-private-photos --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'

# Add lifecycle rule for 7-day expiration
aws s3api put-bucket-lifecycle-configuration --bucket facecraft-private-photos --lifecycle-configuration file://s3-lifecycle.json
```

Create `s3-lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "DeletePhotosAfter7Days",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "originals/"
      },
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "DeleteSelfiesAfter1Day",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temporary/selfies/"
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

### 1.2 Create IAM Role for EC2

Create a file `ec2-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create a file `facecraft-policy.json`:
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

Create the IAM role:
```powershell
# Create role
aws iam create-role --role-name FaceCraftEC2Role --assume-role-policy-document file://ec2-trust-policy.json

# Create policy
aws iam create-policy --policy-name FaceCraftPolicy --policy-document file://facecraft-policy.json

# Attach policy to role (replace YOUR_ACCOUNT_ID with your AWS account ID)
aws iam attach-role-policy --role-name FaceCraftEC2Role --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/FaceCraftPolicy

# Create instance profile
aws iam create-instance-profile --instance-profile-name FaceCraftInstanceProfile

# Add role to instance profile
aws iam add-role-to-instance-profile --instance-profile-name FaceCraftInstanceProfile --role-name FaceCraftEC2Role
```

### 1.3 Create Security Group

```powershell
# Create security group (replace YOUR_VPC_ID with your VPC ID)
aws ec2 create-security-group --group-name facecraft-sg --description "Security group for FaceCraft application" --vpc-id YOUR_VPC_ID

# Allow SSH (replace YOUR_IP with your IP address and sg-xxxxxxxxx with the security group ID from above)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 22 --cidr YOUR_IP/32

# Allow HTTP
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
```

## Step 2: Launch EC2 Instance

### 2.1 Launch Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --count 1 \
  --instance-type t3.large \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-xxxxxxxxx \
  --iam-instance-profile Name=FaceCraftInstanceProfile \
  --block-device-mappings '[
    {
      "DeviceName": "/dev/sda1",
      "Ebs": {
        "VolumeSize": 50,
        "VolumeType": "gp3",
        "Encrypted": true
      }
    }
  ]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FaceCraft-Production}]'
```

### 2.2 Allocate Elastic IP

```powershell
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Associate with instance (replace i-xxxxxxxxx with your instance ID and eipalloc-xxxxxxxxx with allocation ID from above)
aws ec2 associate-address --instance-id i-xxxxxxxxx --allocation-id eipalloc-xxxxxxxxx
```

### 2.3 Configure DNS (if you have a domain)

Point your domain's A record to the Elastic IP address.

## Step 3: Initial Server Setup

### 3.1 Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 3.2 Run Setup Script

Before running this section, you need the `ec2-setup.sh` script on the EC2 server.

If you pushed the project to GitHub, replace:

- `<github-username>` with your GitHub username
- `<repo-name>` with your repository name, usually `facecraft`
- `main` with your real branch name if it is different

```bash
# Download and run setup script from GitHub
wget https://raw.githubusercontent.com/<github-username>/<repo-name>/main/infrastructure/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

Example:

```bash
wget https://raw.githubusercontent.com/your-github-username/facecraft/main/infrastructure/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

If you did not push the project to GitHub, copy the script manually from your Windows machine to EC2 first. Run this in Windows PowerShell, not inside EC2:

```powershell
scp -i "C:\path\to\your-key.pem" "C:\Users\User\facecraft\infrastructure\scripts\ec2-setup.sh" ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/ec2-setup.sh
```

Then run this inside the EC2 SSH terminal:

```bash
chmod +x /home/ubuntu/ec2-setup.sh
/home/ubuntu/ec2-setup.sh
```

**IMPORTANT**: Save the database password and session secret that the script outputs!

## Step 4: Deploy Application

### 4.1 Clone Repository

Before running this section, your code must already be available from GitHub.

If you have not pushed the project to GitHub, do not run `git clone` yet. Either push the project to GitHub first, or manually copy the full project folder to EC2.

Replace:

- `<github-username>` with your GitHub username
- `<repo-name>` with your repository name, usually `facecraft`

```bash
cd /var/www/facecraft
git clone https://github.com/<github-username>/<repo-name>.git .
```

Example:

```bash
cd /var/www/facecraft
git clone https://github.com/your-github-username/facecraft.git .
```

If you are manually copying the project instead of using GitHub, create a zip of the project on Windows, upload it to EC2, then unzip it into `/var/www/facecraft`.

Run this in Windows PowerShell:

```powershell
Compress-Archive -Path "C:\Users\User\facecraft\*" -DestinationPath "C:\Users\User\facecraft.zip" -Force
scp -i "C:\path\to\your-key.pem" "C:\Users\User\facecraft.zip" ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/facecraft.zip
```

Then run this inside the EC2 SSH terminal:

```bash
cd /var/www/facecraft
unzip /home/ubuntu/facecraft.zip -d /var/www/facecraft
```

### 4.2 Create Environment File

```bash
nano apps/api/.env
```

Add this content (replace with your actual values):

```env
NODE_ENV=production
API_PORT=4000
APP_URL=https://your-domain.com
API_URL=http://localhost:4000

DATABASE_URL="mysql://facecraft:YOUR_DB_PASSWORD@127.0.0.1:3306/facecraft"
SESSION_SECRET="YOUR_SESSION_SECRET"

AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=facecraft-private-photos
REKOGNITION_COLLECTION_ID=facecraft-photos

PHOTO_RETENTION_DAYS=7
SIGNED_URL_TTL_SECONDS=300
KIOSK_SESSION_TTL_MINUTES=30
```

Set proper permissions:
```bash
chmod 600 apps/api/.env
```

### 4.3 Install Dependencies and Build

```bash
npm install --production=false
npm run build
```

### 4.4 Setup Database

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

### 4.5 Start Services with PM2

```bash
# Start API
pm2 start apps/api/dist/index.js --name facecraft-api

# Start Next.js
cd apps/web
pm2 start npm --name facecraft-web -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration

```bash
sudo cp infrastructure/nginx/facecraft.conf /etc/nginx/sites-available/facecraft
sudo ln -s /etc/nginx/sites-available/facecraft /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 5.2 Update Domain in Nginx Config

```bash
sudo nano /etc/nginx/sites-available/facecraft
# Change server_name to your domain
```

### 5.3 Test and Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Setup HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 7: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 8: Setup Monitoring and Backups

### 8.1 MySQL Backup Script

```bash
sudo nano /usr/local/bin/facecraft-backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/facecraft"
DB_NAME="facecraft"
DB_USER="facecraft"
DB_PASSWORD="YOUR_DB_PASSWORD"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p"$DB_PASSWORD" $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://facecraft-backups/

# Keep only last 7 days locally
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/facecraft-backup.sh

# Add to crontab
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/facecraft-backup.sh
```

### 8.2 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/facecraft
```

Add:
```
/var/www/facecraft/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Step 9: Verify Deployment

### 9.1 Check Services

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check Nginx
sudo systemctl status nginx

# Check MySQL
sudo systemctl status mysql
```

### 9.2 Test Application

1. Visit `https://your-domain.com`
2. Go to `/kiosk` - should load kiosk interface
3. Go to `/login` - try logging in with test account
4. Test API: `curl https://your-domain.com/api/health`

### 9.3 Test Database

```bash
mysql -u facecraft -p facecraft
# Run some queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
EXIT;
```

## Step 10: Production Checklist

- [ ] Elastic IP allocated and DNS configured
- [ ] SSL certificate installed and auto-renewal working
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] IAM role attached to EC2 (no AWS keys in files)
- [ ] S3 bucket is private with encryption enabled
- [ ] Database backups running daily
- [ ] PM2 configured to start on boot
- [ ] All `.env` files have production values
- [ ] Test accounts created via seed
- [ ] Rekognition collection created
- [ ] Log rotation configured
- [ ] Monitoring/alerts setup (optional but recommended)

## Troubleshooting

### Services won't start
```bash
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
mysql -u facecraft -p
# Test connection and permissions
```

### AWS permissions issues
```bash
# Check IAM role is attached
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://facecraft-private-photos/
```

### Application not accessible
```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check security group in AWS console
```

## Updating the Application

Use the deployment script:
```bash
cd /var/www/facecraft
./infrastructure/scripts/deploy.sh
```

## Rollback

```bash
cd /var/www/facecraft
git checkout PREVIOUS_COMMIT
npm install
npm run build
pm2 restart all
```

## Support

- Check logs: `pm2 logs`
- Monitor: `pm2 monit`
- Restart services: `pm2 restart all`
- View Nginx errors: `sudo tail -f /var/log/nginx/error.log`
