#!/bin/bash

# FaceCraft EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e

echo "🚀 Starting FaceCraft EC2 Setup..."

# Colors
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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install MySQL
print_status "Installing MySQL Server..."
sudo apt install -y mysql-server

# Secure MySQL installation (automated)
print_status "Securing MySQL..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'temp_root_password';"
sudo mysql -u root -ptemp_root_password -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -u root -ptemp_root_password -e "DROP DATABASE IF EXISTS test;"
sudo mysql -u root -ptemp_root_password -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -u root -ptemp_root_password -e "FLUSH PRIVILEGES;"

# Create FaceCraft database and user
print_status "Creating FaceCraft database..."
MYSQL_ROOT_PASSWORD="temp_root_password"
FACECRAFT_DB_PASSWORD=$(openssl rand -base64 32)

sudo mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS facecraft;
CREATE USER IF NOT EXISTS 'facecraft'@'localhost' IDENTIFIED BY '${FACECRAFT_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON facecraft.* TO 'facecraft'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Database created with user: facecraft"
print_warning "SAVE THIS PASSWORD: ${FACECRAFT_DB_PASSWORD}"

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install build tools
print_status "Installing build tools..."
sudo apt install -y build-essential git

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/facecraft
sudo chown -R ubuntu:ubuntu /var/www/facecraft

# Generate SESSION_SECRET
SESSION_SECRET=$(openssl rand -base64 32)

print_status "Setup complete!"
echo ""
print_warning "IMPORTANT: Save these credentials!"
echo "Database Password: ${FACECRAFT_DB_PASSWORD}"
echo "Session Secret: ${SESSION_SECRET}"
echo ""
print_status "Next steps:"
echo "1. Clone your repository to /var/www/facecraft"
echo "2. Create .env file with the credentials above"
echo "3. Run the deployment script"
