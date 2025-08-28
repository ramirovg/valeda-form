@echo off
echo === TRANSFERRING VALEDA FILES TO SERVER (Windows) ===
echo Target: root@104.248.69.154:/var/www/oftalmonet.mx/valeda/
echo.

REM Check if we have scp available (Git Bash, WSL, or Cygwin)
where scp >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ SCP not found. Please use one of these methods:
    echo    1. Install Git for Windows (includes Git Bash with scp)
    echo    2. Use WSL (Windows Subsystem for Linux)
    echo    3. Use WinSCP GUI application
    echo    4. Use the manual file transfer method below
    echo.
    goto :manual_method
)

REM Set server details
set SERVER_USER=root
set SERVER_HOST=104.248.69.154
set SERVER_PATH=/var/www/oftalmonet.mx/valeda

echo --- Step 1: Create Deployment Archive ---
echo Creating deployment package...

REM Use Git Bash tar if available, otherwise use PowerShell
where tar >nul 2>nul
if %errorlevel% equ 0 (
    tar -czf valeda-deployment.tar.gz server-production.js ecosystem.config.js package.json .env.template
    echo ✅ Archive created with tar
) else (
    powershell -Command "Compress-Archive -Path 'server-production.js','ecosystem.config.js','package.json','.env.template' -DestinationPath 'valeda-deployment.zip' -Force"
    echo ✅ Archive created with PowerShell
)

echo.
echo --- Step 2: Transfer Setup Script ---
echo Uploading infrastructure setup script...
scp existing-infrastructure-setup.sh %SERVER_USER%@%SERVER_HOST%:/root/
if %errorlevel% neq 0 goto :transfer_error

echo.
echo --- Step 3: Run Infrastructure Setup on Server ---
echo Running infrastructure verification...
ssh %SERVER_USER%@%SERVER_HOST% "chmod +x /root/existing-infrastructure-setup.sh && /root/existing-infrastructure-setup.sh"
if %errorlevel% neq 0 goto :ssh_error

echo.
echo --- Step 4: Transfer Application Files ---
if exist valeda-deployment.tar.gz (
    echo Uploading tar.gz archive...
    scp valeda-deployment.tar.gz %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
) else (
    echo Uploading zip archive...
    scp valeda-deployment.zip %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
)
if %errorlevel% neq 0 goto :transfer_error

echo.
echo --- Step 5: Copy Browser and Server Files ---
echo Transferring Angular build files...
scp -r ..\dist\valeda-form\browser %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
scp -r ..\dist\valeda-form\server %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/
if %errorlevel% neq 0 goto :transfer_error

echo.
echo ✅ ALL FILES TRANSFERRED SUCCESSFULLY!
echo.
echo Next steps (run on server):
echo   ssh %SERVER_USER%@%SERVER_HOST%
echo   cd %SERVER_PATH%
echo   npm install --production
echo   pm2 start ecosystem.config.js --env production
goto :end

:transfer_error
echo ❌ File transfer error occurred
echo Please check your SSH connection and try again
goto :end

:ssh_error
echo ❌ SSH connection error occurred
echo Please verify server connection and try again
goto :end

:manual_method
echo.
echo === MANUAL TRANSFER METHOD ===
echo.
echo If you don't have SCP, you can use these alternatives:
echo.
echo 1. **WinSCP (Recommended for Windows)**
echo    - Download from: https://winscp.net/
echo    - Connect to: 104.248.69.154
echo    - Username: root
echo    - Transfer these files to /var/www/oftalmonet.mx/valeda/:
echo      * server-production.js
echo      * ecosystem.config.js  
echo      * package.json
echo      * .env.template
echo      * ../dist/valeda-form/browser/ (entire folder)
echo      * ../dist/valeda-form/server/ (entire folder)
echo.
echo 2. **Git Clone Method (Alternative)**
echo    - Push current deployment to your Git repository
echo    - SSH to server: ssh root@104.248.69.154
echo    - Clone: git clone https://github.com/ramirovg/valeda-form.git /var/www/oftalmonet.mx/valeda
echo    - Switch to deployment branch
echo.
echo 3. **WSL Method**
echo    - Open Windows Subsystem for Linux
echo    - Navigate to this directory in WSL
echo    - Run: ./transfer-to-server.sh

:end
echo.
echo === TRANSFER PROCESS COMPLETED ===
pause