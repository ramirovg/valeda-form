@echo off
REM Valeda Form Deployment Script for Windows
REM Usage: deploy.bat

echo [INFO] Starting Valeda Form deployment build...

REM Check if Node.js is available
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    exit /b 1
)

echo [INFO] Installing production dependencies...
call npm install --only=prod
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [INFO] Building application for production...
call npm run build:production
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed
    exit /b 1
)

echo [INFO] Creating deployment package...
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Create deployment directory
if not exist "deployment" mkdir deployment

REM Copy files to deployment directory
xcopy /E /Y dist\valeda-form deployment\dist\valeda-form\
copy server-production.js deployment\
copy ecosystem.config.js deployment\
copy package.json deployment\
copy package-lock.json deployment\
copy .env.template deployment\
xcopy /E /Y nginx deployment\nginx\

echo [SUCCESS] Deployment package created in 'deployment' directory

echo [INFO] Deployment build completed successfully!
echo.
echo Next steps:
echo 1. Upload the 'deployment' directory to your DigitalOcean server
echo 2. Follow the manual deployment instructions in DEPLOYMENT_PLAN.md
echo 3. Configure Nginx and PM2 on the server
echo.

pause