@echo off
echo === GIT-BASED DEPLOYMENT TO SERVER (Windows Version) ===
echo Target: root@104.248.69.154:/var/www/oftalmonet.mx/valeda/
echo.

cd /d "%~dp0\.."

echo --- Step 1: Commit Current Deployment State ---
echo Staging deployment files...
git add deployment/
git add dist/ 2>nul || echo dist/ not in git (expected)

echo.
echo Current git status:
git status --short

echo.
set /p commit_choice=Commit deployment files? (y/n): 
if /i "%commit_choice%"=="y" (
    git commit -m "Production deployment files ready - Windows deployment

📦 Deployment package includes:
- Production server configuration
- PM2 ecosystem configuration  
- Environment template
- Built Angular application
- Database setup scripts

🚀 Ready for deployment to 104.248.69.154

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    echo Pushing to repository...
    git push origin deployment/production-setup
    if %errorlevel% equ 0 (
        echo ✅ Files pushed to repository
    ) else (
        echo ❌ Git push failed
        pause
        exit /b 1
    )
) else (
    echo Skipping commit - using existing repository state
)

echo.
echo --- Step 2: Connect to Server and Deploy ---
echo.
echo Please run these commands on your server:
echo.
echo   ssh root@104.248.69.154
echo.
echo Then copy and paste these commands one by one:
echo.
echo   # Setup infrastructure
echo   cd /var/www/oftalmonet.mx/
echo   
echo   # Backup existing directory if it exists
echo   if [ -d "valeda" ]; then mv valeda valeda-backup-$(date +%%Y%%m%%d-%%H%%M%%S); fi
echo   
echo   # Clone repository
echo   git clone https://github.com/ramirovg/valeda-form.git valeda
echo   cd valeda
echo   
echo   # Switch to deployment branch
echo   git checkout deployment/production-setup
echo   
echo   # Setup deployment structure
echo   cp deployment/server-production.js ./
echo   cp deployment/ecosystem.config.js ./
echo   cp deployment/package.json ./
echo   cp deployment/.env.template ./
echo   
echo   # Copy built files
echo   if [ -d "dist/valeda-form/browser" ]; then cp -r dist/valeda-form/browser ./; fi
echo   if [ -d "dist/valeda-form/server" ]; then cp -r dist/valeda-form/server ./; fi
echo   
echo   # Set permissions
echo   chown -R $USER:$USER /var/www/oftalmonet.mx/valeda
echo   chmod +x server-production.js
echo   
echo   # Create environment file
echo   if [ ! -f .env ]; then cp .env.template .env; fi
echo   
echo   # Install dependencies
echo   npm install --production
echo   
echo   # Start with PM2
echo   pm2 start ecosystem.config.js --env production
echo.
echo === WINDOWS DEPLOYMENT COMMANDS READY ===
echo.
echo 🎯 Next: SSH to your server and run the commands above
echo.
pause