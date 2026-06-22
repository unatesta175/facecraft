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

This step installs server software on the EC2 instance:

- Node.js 20
- MySQL
- Nginx
- PM2
- Git and build tools
- The `/var/www/facecraft` application folder

### 3.1 Before You Start

You must already have these from Step 2:

- Your EC2 instance is running
- Your key pair `.pem` file is downloaded on your Windows computer
- Your Elastic IP is associated with the EC2 instance
- Your EC2 Security Group allows SSH port `22` from your IP

Replace these values in the commands below:
""
- `C:\Users\User\Downloads\facecraft-key.pem` = the real path to your downloaded `.pem` file
- `54.255.93.4` = your EC2 Elastic IP, for example `54.123.45.67`

### 3.2 Connect to EC2

Run this command in **Windows PowerShell**:

```powershell
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_ELASTIC_IP
```

Example:

```powershell
ssh -i "C:\Users\User\Downloads\facecraft-key.pem" ubuntu@54.123.45.67
```

If it asks:

```text
Are you sure you want to continue connecting?
```

Type:

```text
yes
```

After this works, your terminal is now **inside the EC2 server**. Commands from the next sections are Linux commands unless stated otherwise.

### 3.3 Get the Setup Script Onto EC2

You have two choices.

#### Option A: Download From GitHub

Use this only if you already pushed this full `facecraft` monorepo to GitHub.

Run this **inside the EC2 SSH terminal**:

```bash
wget https://raw.githubusercontent.com/<github-username>/<repo-name>/main/infrastructure/scripts/ec2-setup.sh
```

Example:

```bash
wget https://raw.githubusercontent.com/your-github-username/facecraft/main/infrastructure/scripts/ec2-setup.sh
```

#### Option B: Copy From Windows Manually

Use this if you have not pushed the project to GitHub.

Open a **new Windows PowerShell window on your computer**. Do not run this inside the EC2 SSH terminal:

```powershell
scp -i "C:\path\to\your-key.pem" "C:\Users\User\facecraft\infrastructure\scripts\ec2-setup.sh" ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/ec2-setup.sh
```

Then go back to your **EC2 SSH terminal**.

### 3.4 Run the Setup Script

Run this **inside the EC2 SSH terminal**:

```bash
chmod +x /home/ubuntu/ec2-setup.sh
/home/ubuntu/ec2-setup.sh
```

If you downloaded with `wget`, the file may be in your current folder instead. In that case run:

```bash
chmod +x ec2-setup.sh
./ec2-setup.sh
```

If the script stops with `Plugin 'mysql_native_password' is not loaded`, your EC2 instance installed a newer MySQL version. Update `infrastructure/scripts/ec2-setup.sh` from this repository, then re-upload or re-download the script and run it again.

When the script finishes, it prints two important values:

- `Database Password`
- `Session Secret`

Save both values. You need them in Step 5.1.

## Step 4: Put the FaceCraft Code on EC2

The server is ready now, but your application code still needs to be placed in `/var/www/facecraft`.

### 4.1 Choose How to Upload the Code

Use one of these methods:

- **GitHub method**: recommended if you pushed this monorepo to GitHub
- **Manual zip method**: use this if you do not want to use GitHub yet

### 4.2 GitHub Method

Run this **inside the EC2 SSH terminal**:

```bash
cd /var/www/facecraft
git clone https://github.com/<github-username>/<repo-name>.git .
```

Example:

```bash
cd /var/www/facecraft
git clone https://github.com/your-github-username/facecraft.git .
```

If your GitHub repository is private, this may ask for authentication. For beginners, a public temporary repository is simpler, but do not commit secrets like `.env`, AWS keys, or `credentials.txt`.

### 4.3 Manual Zip Method

Run this in **Windows PowerShell**:

```powershell
Compress-Archive -Path "C:\Users\User\facecraft\*" -DestinationPath "C:\Users\User\facecraft.zip" -Force
scp -i "C:\path\to\your-key.pem" "C:\Users\User\facecraft.zip" ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/facecraft.zip
```

Then run this **inside the EC2 SSH terminal**:

```bash
sudo apt install -y unzip
cd /var/www/facecraft
unzip /home/ubuntu/facecraft.zip -d /var/www/facecraft
```

### 4.4 Confirm the Code Is in the Right Place

Run this **inside the EC2 SSH terminal**:

```bash
cd /var/www/facecraft
ls
```

You should see files and folders like:

```text
apps
packages
infrastructure
package.json
```

If you do not see those, stop and fix the upload/clone before continuing.

## Step 5: Create Production Environment Files

### 5.1 Create Backend `.env`

Run this **inside the EC2 SSH terminal**:

```bash
cd /var/www/facecraft
nano apps/api/.env
```

Paste this content. Replace the values marked with `YOUR_...`.

If you are not using a domain yet, use your Elastic IP for `APP_URL`:

```env
NODE_ENV=production
API_PORT=4000
APP_URL=http://YOUR_ELASTIC_IP
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

Example without domain:

```env
APP_URL=http://54.123.45.67
DATABASE_URL="mysql://facecraft:the-password-from-step-3@127.0.0.1:3306/facecraft"
SESSION_SECRET="the-session-secret-from-step-3"
```

Save in `nano`:

1. Press `Ctrl + O`
2. Press `Enter`
3. Press `Ctrl + X`

Then secure the file:

```bash
chmod 600 apps/api/.env
```

### 5.2 Create Frontend `.env.production`

The Next.js frontend needs to know where the API is before you build it.

Run this **inside the EC2 SSH terminal**:

```bash
nano apps/web/.env.production
```

If you are using only the Elastic IP:

```env
NEXT_PUBLIC_API_URL=http://54.255.93.4
```

Example:

```env
NEXT_PUBLIC_API_URL=http://54.123.45.67
```

If you later use a domain:

```env
NEXT_PUBLIC_API_URL=https://your-domain.com
```

Save with `Ctrl + O`, `Enter`, then `Ctrl + X`.

## Step 6: Install, Build, and Prepare Database

Run all commands in this step **inside the EC2 SSH terminal**.

### 6.1 Install Dependencies

```bash
cd /var/www/facecraft
npm install --production=false
```

This may take several minutes.

### 6.2 Generate Prisma Client

```bash
npm run db:generate
```

### 6.3 Run Database Migration

Use the API workspace deploy migration command:

```bash
npm run db:migrate:deploy --workspace=apps/api
```

### 6.4 Seed the Database

```bash
npm run db:seed
```

This creates the test users, roles, products, packages, event data, and dummy setup data.

### 6.5 Build the Apps

```bash
npm run build
```

## Step 7: Start the App With PM2

Run these commands **inside the EC2 SSH terminal**.

### 7.1 Start Backend API

```bash
cd /var/www/facecraft
pm2 start apps/api/dist/index.js --name facecraft-api
```

### 7.2 Start Frontend Web App

```bash
cd /var/www/facecraft/apps/web
pm2 start npm --name facecraft-web -- start
```

### 7.3 Save PM2 Startup Configuration

```bash
pm2 save
pm2 startup
```

The `pm2 startup` command will print another command that starts with `sudo env ...`.

Copy that printed command, paste it into the EC2 terminal, and run it.

### 7.4 Check PM2 Status

```bash
pm2 status
```

You should see:

- `facecraft-api`
- `facecraft-web`

Both should show `online`.

## Step 8: Configure Nginx

Nginx receives browser traffic on port `80` and forwards it to:

- Next.js frontend on port `3000`
- API backend on port `4000`

### 8.1 Copy the Nginx Config

Run this **inside the EC2 SSH terminal**:

```bash
cd /var/www/facecraft
sudo cp infrastructure/nginx/facecraft.conf /etc/nginx/sites-available/facecraft
sudo ln -s /etc/nginx/sites-available/facecraft /etc/nginx/sites-enabled/facecraft
sudo rm -f /etc/nginx/sites-enabled/default
```

### 8.2 Update `server_name`

Run:

```bash
sudo nano /etc/nginx/sites-available/facecraft
```

Find this line:

```nginx
server_name facecraft.example.com;
```

If you are using Elastic IP only, change it to:

```nginx
server_name _;
```

If you are using a domain, change it to:

```nginx
server_name your-domain.com;
```

Save with `Ctrl + O`, `Enter`, then `Ctrl + X`.

### 8.3 Test and Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

If `sudo nginx -t` shows an error, do not restart until the error is fixed.

## Step 9: Configure Firewall

Run this **inside the EC2 SSH terminal**:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

Also confirm your AWS EC2 Security Group allows:

- SSH `22` from your IP
- HTTP `80` from anywhere
- HTTPS `443` from anywhere, only needed if you set up HTTPS

## Step 10: Test the App

### 10.1 Test From EC2

Run this **inside the EC2 SSH terminal**:

```bash
curl http://localhost:4000/api/health
curl http://localhost:3000
```

### 10.2 Test Through Nginx

Run this **inside the EC2 SSH terminal**:

```bash
curl http://localhost/api/health
```

### 10.3 Test From Your Browser

Open this in your browser:

```text
http://YOUR_ELASTIC_IP
```

Example:

```text
http://54.123.45.67
```

Then test:

- `/` should load the home page
- `/kiosk` should load the kiosk page
- `/login` should load the login page
- `/api/health` should return API health JSON

## Step 11: Optional HTTPS Setup

Only do this if you have a domain name pointed to your Elastic IP.

Do not run Certbot for only an IP address. Let's Encrypt certificates require a real domain.

Run this **inside the EC2 SSH terminal**:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

After HTTPS is working, update:

- `apps/api/.env`: `APP_URL=https://your-domain.com`
- `apps/web/.env.production`: `NEXT_PUBLIC_API_URL=https://your-domain.com`

Then rebuild and restart:

```bash
cd /var/www/facecraft
npm run build
pm2 restart facecraft-api facecraft-web
```

## Step 12: Optional Backups and Logs

### 12.1 MySQL Backup Script

Run this **inside the EC2 SSH terminal**:

```bash
sudo nano /usr/local/bin/facecraft-backup.sh
```

Paste this content and replace `YOUR_DB_PASSWORD`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/facecraft"
DB_NAME="facecraft"
DB_USER="facecraft"
DB_PASSWORD="YOUR_DB_PASSWORD"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p"$DB_PASSWORD" $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Then run:

```bash
sudo chmod +x /usr/local/bin/facecraft-backup.sh
sudo crontab -e
```

Add this line to run daily at 2 AM:

```text
0 2 * * * /usr/local/bin/facecraft-backup.sh
```

### 12.2 Log Rotation

Run this **inside the EC2 SSH terminal**:

```bash
sudo nano /etc/logrotate.d/facecraft
```

Paste:

```text
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

## Step 13: Production Checklist

- [ ] EC2 instance is running
- [ ] Elastic IP is associated with EC2
- [ ] IAM role is attached to EC2
- [ ] S3 bucket is private with encryption enabled
- [ ] Rekognition collection is created
- [ ] Code is in `/var/www/facecraft`
- [ ] `apps/api/.env` exists with production values
- [ ] `apps/web/.env.production` exists before building Next.js
- [ ] `npm install --production=false` completed
- [ ] Prisma migration and seed completed
- [ ] `npm run build` completed
- [ ] `facecraft-api` and `facecraft-web` are online in PM2
- [ ] Nginx config test passes
- [ ] Browser can open `http://YOUR_ELASTIC_IP`
- [ ] HTTPS is configured only if using a domain
- [ ] Database backups are configured, if needed

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
