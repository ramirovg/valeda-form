#!/bin/bash
echo "=== TRANSFERRING VALEDA FILES TO SERVER ==="
echo "Target: root@104.248.69.154:/var/www/oftalmonet.mx/valeda/"
echo ""

# Set server details
SERVER_USER="root"
SERVER_HOST="104.248.69.154"
SERVER_PATH="/var/www/oftalmonet.mx/valeda"

echo "--- Step 1: Transfer Setup Script ---"
echo "Uploading infrastructure setup script..."
scp existing-infrastructure-setup.sh ${SERVER_USER}@${SERVER_HOST}:/root/

echo ""
echo "--- Step 2: Run Infrastructure Setup on Server ---"
echo "Running infrastructure verification on server..."
ssh ${SERVER_USER}@${SERVER_HOST} "chmod +x /root/existing-infrastructure-setup.sh && /root/existing-infrastructure-setup.sh"

echo ""
echo "--- Step 3: Transfer Application Files ---"
echo "Creating deployment archive..."

# Create a deployment archive with all necessary files
tar -czf valeda-deployment.tar.gz \
    server-production.js \
    ecosystem.config.js \
    package.json \
    .env.template \
    ../dist/valeda-form/browser \
    ../dist/valeda-form/server

echo "✅ Deployment archive created: valeda-deployment.tar.gz"

echo ""
echo "Uploading deployment files to server..."
scp valeda-deployment.tar.gz ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo ""
echo "--- Step 4: Extract and Setup on Server ---"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /var/www/oftalmonet.mx/valeda

echo "Extracting deployment files..."
tar -xzf valeda-deployment.tar.gz

echo "Setting up file structure..."
# Move browser files to correct location
if [ -d "dist/valeda-form/browser" ]; then
    mv dist/valeda-form/browser ./
    echo "✅ Browser files moved to ./browser/"
fi

# Move server files to correct location  
if [ -d "dist/valeda-form/server" ]; then
    mv dist/valeda-form/server ./
    echo "✅ Server files moved to ./server/"
fi

# Clean up
rm -rf dist/
rm valeda-deployment.tar.gz

echo "Setting proper permissions..."
chown -R $USER:$USER /var/www/oftalmonet.mx/valeda
chmod +x server-production.js

echo "Creating environment file from template..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo "⚠️  Please edit .env file with your production values"
else
    echo "✅ .env file already exists"
fi

echo "Final directory structure:"
ls -la

echo ""
echo "✅ Files transferred and extracted successfully!"
echo ""
echo "--- Next Steps ---"
echo "1. Edit .env file if needed: nano .env"
echo "2. Install dependencies: npm install --production"
echo "3. Start application: pm2 start ecosystem.config.js --env production"

ENDSSH

echo ""
echo "=== FILE TRANSFER COMPLETED ==="
echo ""
echo "🎯 Next: Run 'npm install --production' on the server"
echo "🎯 Then: Start the application with PM2"