#!/bin/bash
echo "=== GIT-BASED DEPLOYMENT TO SERVER ==="
echo "This method uses Git to transfer files - cleanest and most reliable"
echo ""

SERVER_USER="root"
SERVER_HOST="104.248.69.154"
SERVER_PATH="/var/www/oftalmonet.mx/valeda"

echo "--- Step 1: Commit Current Deployment State ---"
cd ..
echo "Staging deployment files..."
git add deployment/
git add dist/ 2>/dev/null || echo "dist/ not in git (expected)"

echo "Checking git status..."
git status

echo ""
read -p "Commit deployment files? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "Production deployment files ready

📦 Deployment package includes:
- Production server configuration
- PM2 ecosystem configuration  
- Environment template
- Built Angular application
- Database setup scripts

🚀 Ready for deployment to 104.248.69.154

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "Pushing to repository..."
    git push origin deployment/production-setup
    echo "✅ Files pushed to repository"
else
    echo "Skipping commit - using existing repository state"
fi

echo ""
echo "--- Step 2: Setup Application Directory on Server ---"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
echo "Running infrastructure setup..."
if [ -f /root/existing-infrastructure-setup.sh ]; then
    chmod +x /root/existing-infrastructure-setup.sh
    /root/existing-infrastructure-setup.sh
else
    echo "Creating application directory..."
    mkdir -p /var/www/oftalmonet.mx/valeda
    cd /var/www/oftalmonet.mx/valeda
    chown -R $USER:$USER /var/www/oftalmonet.mx/valeda
fi
ENDSSH

echo ""
echo "--- Step 3: Clone Repository on Server ---"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /var/www/oftalmonet.mx/

# Remove existing directory if it exists
if [ -d "valeda" ]; then
    echo "Backing up existing directory..."
    mv valeda valeda-backup-$(date +%Y%m%d-%H%M%S)
fi

echo "Cloning repository..."
git clone https://github.com/ramirovg/valeda-form.git valeda

cd valeda

echo "Switching to deployment branch..."
git checkout deployment/production-setup

echo "Setting up deployment structure..."
# Copy deployment files to root
cp deployment/server-production.js ./
cp deployment/ecosystem.config.js ./
cp deployment/package.json ./
cp deployment/.env.template ./

# Copy built files if they exist in the repo
if [ -d "dist/valeda-form/browser" ]; then
    cp -r dist/valeda-form/browser ./
    echo "✅ Browser files copied"
fi

if [ -d "dist/valeda-form/server" ]; then
    cp -r dist/valeda-form/server ./  
    echo "✅ Server files copied"
fi

# Set proper permissions
chown -R $USER:$USER /var/www/oftalmonet.mx/valeda
chmod +x server-production.js

echo "Creating .env from template..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo "✅ .env file created from template"
fi

echo ""
echo "Final directory structure:"
ls -la

echo ""
echo "✅ Repository cloned and configured successfully!"

ENDSSH

echo ""
echo "=== GIT DEPLOYMENT COMPLETED ==="
echo ""
echo "🎯 Next steps (run on server):"
echo "   ssh root@104.248.69.154"
echo "   cd /var/www/oftalmonet.mx/valeda"
echo "   npm install --production"
echo "   pm2 start ecosystem.config.js --env production"