#!/bin/bash

# Deployment script for AWS EC2
# Run this script on your EC2 instance after cloning the repository

set -e

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "Please do not run as root. Use a regular user with sudo privileges."
   exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Nginx...${NC}"
    sudo apt install -y nginx
fi

# Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
sudo mkdir -p /var/www/clothing-ecommerce
sudo mkdir -p /var/www/clothing-ecommerce/backend/logs
sudo chown -R $USER:$USER /var/www/clothing-ecommerce

# Navigate to project directory (assuming script is run from project root)
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --production

# Install frontend dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm run build

# Copy frontend build to nginx directory
echo -e "${YELLOW}📁 Copying frontend build...${NC}"
sudo cp -r dist/* /var/www/clothing-ecommerce/frontend/dist/

# Copy backend to deployment directory
echo -e "${YELLOW}📁 Copying backend files...${NC}"
sudo cp -r "$BACKEND_DIR"/* /var/www/clothing-ecommerce/backend/

# Setup PM2
echo -e "${YELLOW}⚙️  Setting up PM2...${NC}"
cd /var/www/clothing-ecommerce/backend
pm2 delete clothing-ecommerce-backend 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup Nginx
echo -e "${YELLOW}⚙️  Setting up Nginx...${NC}"
sudo cp "$PROJECT_DIR/nginx.conf" /etc/nginx/sites-available/clothing-ecommerce

# Replace placeholder domain with actual domain/IP
read -p "Enter your domain name or IP address: " DOMAIN
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/clothing-ecommerce

# Create symlink
sudo ln -sf /etc/nginx/sites-available/clothing-ecommerce /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

# Reload nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo systemctl reload nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Create .env file in /var/www/clothing-ecommerce/backend/.env"
echo "2. Update environment variables (MONGO_URI, JWT_SECRET, FRONTEND_URL, etc.)"
echo "3. Restart PM2: pm2 restart clothing-ecommerce-backend"
echo "4. Check logs: pm2 logs clothing-ecommerce-backend"
echo "5. Visit your domain/IP in browser"

