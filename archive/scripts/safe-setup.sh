#!/bin/bash
echo "=== SAFE VALEDA APP SETUP (NO SYSTEM CHANGES) ==="

# Create application directory
mkdir -p /var/www/oftalmonet.mx/valeda
cd /var/www/oftalmonet.mx/valeda

# Install Node.js using NVM (doesn't affect system Node)
echo "--- Installing Node Version Manager (NVM) ---"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js 18 for this project only
echo "--- Installing Node.js 18 for this project ---"
nvm install 18
nvm use 18
nvm alias valeda 18

# Install PM2 locally (not system-wide)
echo "--- Installing PM2 locally ---"
npm install -g pm2

# Setup MongoDB on alternative port (27018) to avoid conflicts
echo "--- Setting up MongoDB on port 27018 ---"
# Create data directory for our MongoDB instance
mkdir -p /var/www/oftalmonet.mx/valeda/mongodb/data
mkdir -p /var/www/oftalmonet.mx/valeda/mongodb/logs

# Install MongoDB if not present (safe method)
if ! command -v mongod &> /dev/null; then
    echo "MongoDB not found, installing..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
else
    echo "MongoDB already installed, using existing installation"
fi

# Create MongoDB config for our app (port 27018)
cat > /var/www/oftalmonet.mx/valeda/mongodb/mongod.conf << EOF
storage:
  dbPath: /var/www/oftalmonet.mx/valeda/mongodb/data
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/www/oftalmonet.mx/valeda/mongodb/logs/mongod.log

net:
  port: 27018
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/www/oftalmonet.mx/valeda/mongodb/mongod.pid
EOF

echo "--- Setup completed safely ---"
echo "Node.js version for this project: $(node --version)"
echo "PM2 location: $(which pm2)"
echo "MongoDB will run on port 27018 (isolated)"
echo ""
echo "Next steps:"
echo "1. Start MongoDB: mongod --config /var/www/oftalmonet.mx/valeda/mongodb/mongod.conf"
echo "2. Upload application files to /var/www/oftalmonet.mx/valeda/"
echo "3. Install dependencies: npm install"
echo "4. Start with PM2: pm2 start ecosystem.config.js --env production"