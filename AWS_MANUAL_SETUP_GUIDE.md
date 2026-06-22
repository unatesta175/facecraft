# FaceCraft AWS Manual Setup Guide

Complete guide to set up all AWS resources through the AWS Console (website).

## Prerequisites

- AWS Account (with billing enabled)
- Access to AWS Console: https://console.aws.amazon.com

---

## Step 1: Create S3 Bucket

### 1.1 Go to S3 Console
1. Open https://console.aws.amazon.com/s3/
2. Click **"Create bucket"**

### 1.2 Configure Bucket
- **Bucket name**: `facecraft-private-photos` (or use a unique name if taken)
- **AWS Region**: `Asia Pacific (Singapore) ap-southeast-1`

### 1.3 Block Public Access
- ✅ **Check "Block all public access"** (should be checked by default)
- All 4 sub-options should be checked

### 1.4 Enable Encryption
- **Bucket Versioning**: Disabled (default)
- **Default encryption**: 
  - Select **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"**
  - ✅ Enable

### 1.5 Click "Create bucket"

### 1.6 Add Lifecycle Rule
1. Click on your bucket name `facecraft-private-photos`
2. Go to **"Management"** tab
3. Click **"Create lifecycle rule"**

**Rule 1: Delete photos after 7 days**
- **Lifecycle rule name**: `DeletePhotosAfter7Days`
- **Choose a rule scope**: Limit the scope using one or more filters
- **Prefix**: `originals/`
- **Lifecycle rule actions**: ✅ Check "Expire current versions of objects"
- **Days after object creation**: `7`
- Click **"Create rule"**

**Rule 2: Delete selfies after 1 day**
- Click **"Create lifecycle rule"** again
- **Lifecycle rule name**: `DeleteSelfiesAfter1Day`
- **Prefix**: `temporary/selfies/`
- **Lifecycle rule actions**: ✅ Check "Expire current versions of objects"
- **Days after object creation**: `1`
- Click **"Create rule"**

✅ **S3 Bucket Complete!**

---

## Step 2: Create IAM Role for EC2

### 2.1 Go to IAM Console
1. Open https://console.aws.amazon.com/iam/
2. Click **"Roles"** in the left sidebar
3. Click **"Create role"**

### 2.2 Select Trusted Entity
- **Trusted entity type**: AWS service
- **Use case**: EC2
- Click **"Next"**

### 2.3 Create Custom Policy
1. Click **"Create policy"** (opens in new tab)
2. Click **"JSON"** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
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
      "Sid": "RekognitionAccess",
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateCollection",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:DeleteFaces",
        "rekognition:ListCollections",
        "rekognition:DescribeCollection"
      ],
      "Resource": "*"
    }
  ]
}
```

**Important**: Replace `facecraft-private-photos` with your actual bucket name if different.

4. Click **"Next"**
5. **Policy name**: `FaceCraftEC2Policy`
6. **Description**: `Policy for FaceCraft EC2 to access S3 and Rekognition`
7. Click **"Create policy"**
8. Close this tab and go back to the "Create role" tab

### 2.4 Attach Policy to Role
1. Click the refresh button (🔄) next to "Filter policies"
2. Search for `FaceCraftEC2Policy`
3. ✅ Check the box next to it
4. Click **"Next"**

### 2.5 Name the Role
- **Role name**: `FaceCraftEC2Role`
- **Description**: `IAM role for FaceCraft EC2 instance to access S3 and Rekognition`
- Click **"Create role"**

✅ **IAM Role Complete!**

---

## Step 3: Create Security Group

### 3.1 Go to EC2 Console
1. Open https://console.aws.amazon.com/ec2/
2. Click **"Security Groups"** in the left sidebar (under "Network & Security")
3. Click **"Create security group"**

### 3.2 Configure Security Group
- **Security group name**: `facecraft-sg`
- **Description**: `Security group for FaceCraft application`
- **VPC**: Select your default VPC (or the VPC you want to use)

### 3.3 Add Inbound Rules

Click **"Add rule"** for each of these:

**Rule 1: SSH**
- **Type**: SSH
- **Protocol**: TCP
- **Port range**: 22
- **Source**: My IP (it will auto-detect your IP)
- **Description**: SSH access

**Rule 2: HTTP**
- **Type**: HTTP
- **Protocol**: TCP
- **Port range**: 80
- **Source**: Anywhere-IPv4 (0.0.0.0/0)
- **Description**: HTTP access

**Rule 3: HTTPS**
- **Type**: HTTPS
- **Protocol**: TCP
- **Port range**: 443
- **Source**: Anywhere-IPv4 (0.0.0.0/0)
- **Description**: HTTPS access

### 3.4 Outbound Rules
- Leave default (Allow all outbound traffic)

### 3.5 Click "Create security group"

✅ **Security Group Complete!**

---

## Step 4: Launch EC2 Instance

### 4.1 Go to EC2 Console
1. Open https://console.aws.amazon.com/ec2/
2. Click **"Instances"** in left sidebar
3. Click **"Launch instances"**

### 4.2 Name and AMI
- **Name**: `FaceCraft-Production`
- **Application and OS Images (AMI)**: 
  - Select **"Ubuntu"**
  - Choose **"Ubuntu Server 22.04 LTS (HVM), SSD Volume Type"**
  - Architecture: **64-bit (x86)**

### 4.3 Instance Type
- Select **"t3.large"** (2 vCPU, 8 GB RAM)
- If you want to save costs initially, you can use **"t3.medium"** (2 vCPU, 4 GB RAM) but may be slower

### 4.4 Key Pair
- **Key pair**: 
  - If you have one: Select it
  - If not: Click **"Create new key pair"**
    - **Name**: `facecraft-key`
    - **Key pair type**: RSA
    - **Private key file format**: .pem
    - Click **"Create key pair"** (it will download automatically)
    - **SAVE THIS FILE!** You need it to SSH into the server

### 4.5 Network Settings
- **VPC**: Default (or your preferred VPC)
- **Subnet**: No preference
- **Auto-assign public IP**: Enable
- **Firewall (security groups)**: 
  - Select **"Select existing security group"**
  - Choose **"facecraft-sg"** (the one you created)

### 4.6 Configure Storage
- **Size**: `50` GiB
- **Volume type**: `gp3`
- **Delete on termination**: ✅ Checked
- Click **"Advanced"**
  - **Encrypted**: ✅ Yes
  - **KMS key**: (default) aws/ebs

### 4.7 Advanced Details
- Scroll down to **"IAM instance profile"**
- Select **"FaceCraftEC2Role"**

### 4.8 Summary
- Review all settings
- **Number of instances**: 1
- Click **"Launch instance"**

### 4.9 Wait for Instance to Start
- Click **"View all instances"**
- Wait until **Instance state** shows "Running" (takes ~2 minutes)
- Wait until **Status check** shows "2/2 checks passed" (takes ~5 minutes)

✅ **EC2 Instance Launched!**

---

## Step 5: Allocate Elastic IP

### 5.1 Go to Elastic IPs
1. In EC2 Console, click **"Elastic IPs"** in left sidebar (under "Network & Security")
2. Click **"Allocate Elastic IP address"**

### 5.2 Allocate
- **Network Border Group**: Default
- Click **"Allocate"**

### 5.3 Associate with Instance
1. Select the newly allocated Elastic IP
2. Click **"Actions"** → **"Associate Elastic IP address"**
3. **Resource type**: Instance
4. **Instance**: Select your `FaceCraft-Production` instance
5. **Private IP address**: (auto-selected)
6. Click **"Associate"**

### 5.4 Note Your Elastic IP
- Copy the **Allocated IPv4 address** (e.g., `54.123.456.78`)
- You'll need this to connect via SSH and for DNS

✅ **Elastic IP Allocated!**

---

## Step 6: Get Your AWS Account ID

You'll need this for the `.env` file:

1. Click your username in top-right of AWS Console
2. Your **Account ID** is shown (12 digits)
3. Copy it somewhere

---

## Step 7: Configure DNS (Optional but Recommended)

If you have a domain name, you can access your app via a friendly URL instead of an IP address.

### Option A: Using AWS Route 53

#### 7A.1 Go to Route 53
1. Open https://console.aws.amazon.com/route53/
2. Click **"Hosted zones"** in left sidebar

#### 7A.2 Create Hosted Zone (if you don't have one)
1. Click **"Create hosted zone"**
2. **Domain name**: Your domain (e.g., `facecraftstudio.com`)
3. **Type**: Public hosted zone
4. Click **"Create hosted zone"**

**Cost**: ~$0.50/month per hosted zone

#### 7A.3 Note the Name Servers
1. In your hosted zone, you'll see 4 **NS (Name Server)** records
2. Copy all 4 name servers (e.g., `ns-123.awsdns-12.com`)
3. **Important**: Go to your domain registrar (where you bought the domain) and update the nameservers to these 4 values

#### 7A.4 Create A Record
1. Click your hosted zone name
2. Click **"Create record"**
3. Configure:
   - **Record name**: 
     - Leave empty for root domain (`facecraftstudio.com`)
     - Or enter `app` for subdomain (`app.facecraftstudio.com`)
   - **Record type**: `A - Routes traffic to an IPv4 address`
   - **Value**: Your Elastic IP (e.g., `54.123.456.78`)
   - **TTL**: `300` (5 minutes)
   - **Routing policy**: Simple routing
4. Click **"Create records"**

#### 7A.5 Test DNS
In PowerShell (wait 5-10 minutes after creating):
```powershell
nslookup facecraftstudio.com
# Should return your Elastic IP
```

---

### Option B: Using Your Domain Registrar (Namecheap, GoDaddy, etc.)

#### 7B.1 Log into Your Domain Registrar
- Namecheap: https://namecheap.com
- GoDaddy: https://godaddy.com
- Or wherever you bought your domain

#### 7B.2 Go to DNS Management
- Usually under "Domain List" → Click domain → "Manage" → "Advanced DNS" or "DNS Settings"

#### 7B.3 Add A Record
Click "Add New Record" and enter:

**For root domain** (`facecraftstudio.com`):
- **Type**: A Record
- **Host**: `@` (or leave empty)
- **Value/Points to**: Your Elastic IP (e.g., `54.123.456.78`)
- **TTL**: `300` or Automatic

**For subdomain** (`app.facecraftstudio.com`):
- **Type**: A Record
- **Host**: `app`
- **Value/Points to**: Your Elastic IP (e.g., `54.123.456.78`)
- **TTL**: `300` or Automatic

#### 7B.4 Save Changes

#### 7B.5 Test DNS
In PowerShell (wait 5-30 minutes):
```powershell
nslookup facecraftstudio.com
# Should return your Elastic IP
```

---

### 7.3 Wait for DNS Propagation
- Route 53: Usually 5-10 minutes
- Other registrars: 5-30 minutes (sometimes up to 24 hours)
- Test with: `nslookup your-domain.com`

### 7.4 Update Your .env File Later
When you deploy the app, update `apps/api/.env`:
```env
APP_URL=https://facecraftstudio.com
```

Or if using subdomain:
```env
APP_URL=https://app.facecraftstudio.com
```

---

## Summary - What You Created

✅ **S3 Bucket**: `facecraft-private-photos` in `ap-southeast-1`
- Block public access enabled
- Encryption enabled
- Lifecycle rules for 7-day photo deletion

✅ **IAM Role**: `FaceCraftEC2Role`
- S3 read/write permissions
- Rekognition permissions

✅ **Security Group**: `facecraft-sg`
- SSH (port 22) from your IP
- HTTP (port 80) from anywhere
- HTTPS (port 443) from anywhere

✅ **EC2 Instance**: `FaceCraft-Production`
- Ubuntu 22.04 LTS
- t3.large instance type
- 50 GB encrypted storage
- IAM role attached

✅ **Elastic IP**: Associated with EC2 instance

---

## Next Steps

### 1. Connect to Your EC2 Instance

**Using PowerShell on Windows:**

```powershell
# Navigate to where your .pem key is downloaded
cd ~\Downloads

# Set proper permissions (Windows)
icacls facecraft-key.pem /inheritance:r
icacls facecraft-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect via SSH (replace with your Elastic IP)
ssh -i facecraft-key.pem ubuntu@YOUR_ELASTIC_IP
```

Example:
```powershell
ssh -i facecraft-key.pem ubuntu@54.123.456.78
```

### 2. Run the Setup Script

Once connected to EC2, follow the deployment guide starting from **"Step 3: Initial Server Setup"** in `EC2_DEPLOYMENT_GUIDE.md`.

---

## Important Information to Save

📝 **Write these down:**

| Item | Value | Where to Use |
|------|-------|--------------|
| S3 Bucket Name | `facecraft-private-photos` | `.env` file |
| AWS Region | `ap-southeast-1` | `.env` file |
| Elastic IP | `54.255.93.4` | SSH connection, DNS |
| EC2 Key Pair | `facecraft-key.pem` | SSH connection |
| Security Group ID | `sg-0f78ec66549e16eda` | Reference |
| AWS Account ID | `832721537080` | IAM policies |

---

## Cost Estimate (Monthly)

Approximate AWS costs for this setup:

- **EC2 t3.large** (running 24/7): ~$60-70/month
- **50 GB gp3 Storage**: ~$4/month
- **Elastic IP** (while instance running): Free
- **S3 Storage** (first 50GB): ~$1.15/month
- **Data Transfer**: Variable (first 100GB free/month)
- **Rekognition**: Pay per use (~$1 per 1,000 faces indexed)

**Total**: ~$65-80/month (excluding Rekognition usage)

**To save costs:**
- Use t3.medium instead (~$30/month)
- Stop instance when not in use (pay only for storage)
- Set up billing alerts

---

## Troubleshooting

### Can't SSH into EC2?
- Check Security Group allows SSH from your IP
- Verify instance is "Running" with "2/2 checks passed"
- Ensure you're using correct key file and Elastic IP
- Your IP might have changed - update Security Group

### Can't find IAM Role when launching EC2?
- Wait a few minutes after creating the role
- Refresh the EC2 launch page
- Make sure role is in the same region

### Bucket name already taken?
- S3 bucket names are globally unique
- Try: `facecraft-photos-yourcompany-2026`
- Update the IAM policy with the new bucket name

---

## Next: Deploy Application

After completing all AWS resources, follow the **EC2_DEPLOYMENT_GUIDE.md** starting from **Step 3** to install and deploy the application on your EC2 instance.
