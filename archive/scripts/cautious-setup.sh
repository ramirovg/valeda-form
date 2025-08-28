#!/bin/bash
echo "=== CAUTIOUS SETUP WITH COMPATIBILITY CHECKS ==="

# Function to backup PM2 processes
backup_pm2() {
    if command -v pm2 &> /dev/null; then
        echo "--- Backing up existing PM2 processes ---"
        pm2 save
        pm2 dump > /tmp/pm2-backup-$(date +%Y%m%d).json
        echo "PM2 processes backed up"
    fi
}

# Function to check Node.js compatibility
check_node_compatibility() {
    if command -v node &> /dev/null; then
        current_version=$(node --version | cut -d'v' -f2)
        echo "Current Node.js version: $current_version"
        
        # Check if current version is compatible (14+)
        major_version=$(echo $current_version | cut -d'.' -f1)
        if [ "$major_version" -ge 14 ]; then
            echo "✅ Current Node.js version is compatible"
            return 0
        else
            echo "⚠️  Current Node.js version is too old, needs upgrade"
            return 1
        fi
    else
        echo "Node.js not installed"
        return 1
    fi
}

# Main setup
echo "--- Step 1: Compatibility Assessment ---"
backup_pm2

if check_node_compatibility; then
    echo "--- Using existing Node.js installation ---"
else
    echo "--- Need to install/upgrade Node.js ---"
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "--- Installing PM2 ---"
    npm install -g pm2
    pm2 startup
else
    echo "--- PM2 already installed ---"
    pm2 --version
fi

# MongoDB setup with port flexibility
setup_mongodb() {
    if command -v mongod &> /dev/null; then
        echo "--- MongoDB already installed ---"
        mongod --version | head -1
        
        # Check if port 27017 is in use
        if netstat -tulpn | grep -q ":27017"; then
            echo "⚠️  Port 27017 is in use, will use port 27018 for Valeda"
            export VALEDA_MONGO_PORT=27018
        else
            echo "✅ Port 27017 is available"
            export VALEDA_MONGO_PORT=27017
        fi
    else
        echo "--- Installing MongoDB ---"
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        apt-get update
        apt-get install -y mongodb-org
        systemctl enable mongod
        export VALEDA_MONGO_PORT=27017
    fi
    
    echo "Valeda will use MongoDB port: $VALEDA_MONGO_PORT"
}

setup_mongodb

# Create application directory
echo "--- Creating application directory ---"
mkdir -p /var/www/oftalmonet.mx/valeda
chown -R $USER:$USER /var/www/oftalmonet.mx/valeda

echo "--- Setup Summary ---"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "MongoDB port for Valeda: ${VALEDA_MONGO_PORT:-27017}"
echo ""
echo "✅ Server is ready for deployment!"