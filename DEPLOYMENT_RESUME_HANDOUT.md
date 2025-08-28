# Valeda Form Deployment - Resume Instructions

**Date:** 2025-08-25  
**Status:** Uploading node_modules from backend-api to server  
**Current Step:** Waiting for FileZilla upload to complete

---

## Current Status ✅

### Completed:
- ✅ **Backend architecture separated** from Angular frontend
- ✅ **Frontend built** for production (static files ready)
- ✅ **Server cleaned** and prepared
- ✅ **Backend files uploaded** to `/var/www/html/valeda-api/`
- ✅ **Node.js 16 installed** via NVM (compatible with server GLIBC)
- ✅ **Uploading working node_modules** from `backend-api/` folder

### Currently In Progress:
- 🔄 **FileZilla Upload:** `backend-api/node_modules/` → `/var/www/html/valeda-api/node_modules`

---

## Next Steps When Upload Completes

### Step 1: Test Backend API
```bash
# SSH to server
ssh root@104.248.69.154

# Navigate to backend directory
cd /var/www/html/valeda-api

# Ensure Node.js 16 is active
nvm use 16
node --version  # Should show v16.20.2

# Start backend API with PM2
pm2 start ecosystem.config.js --env production --interpreter /root/.nvm/versions/node/v16.20.2/bin/node

# Check logs for success
pm2 logs valeda-api

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/valeda/api/treatments
```

### Step 2: Upload Frontend (If Backend Works)
**Via FileZilla:**
- **Local:** `deployment/valeda-frontend/*` 
- **Server:** `/var/www/oftalmonet.mx/valeda/`
- **Files to upload:**
  - `favicon.ico`
  - `index.html` 
  - `logo-oftalmolaser-color.png`
  - `main-2K32IF3T.js`
  - `polyfills-5CFQRCPP.js`
  - `styles-5JHKKTCZ.css`

### Step 3: Configure Nginx (If Both Work)
```bash
# Edit Nginx configuration
nano /etc/nginx/sites-available/oftalmonet.mx

# Add location blocks for Valeda:
location /valeda/ {
    alias /var/www/oftalmonet.mx/valeda/;
    try_files $uri $uri/ /valeda/index.html;
}

location /valeda/api/ {
    proxy_pass http://localhost:3001/valeda/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

---

## Troubleshooting Guide

### If Backend Still Fails:
1. **Check PM2 logs:** `pm2 logs valeda-api --lines 50`
2. **Try Node.js 14:** `nvm use 14` (fallback option)
3. **Verify files:** `ls -la /var/www/html/valeda-api/`

### If API Endpoints Don't Work:
1. **Check port binding:** `netstat -tlnp | grep 3001`
2. **Verify MongoDB:** `systemctl status mongod`
3. **Test direct server:** `node server-production.js` (for debugging)

### Common Issues:
- **Permission errors:** `chown -R root:root /var/www/html/valeda-api`
- **PM2 not using correct Node.js:** Always specify `--interpreter` path
- **Database connection:** Check MongoDB is running and accessible

---

## Expected Success Indicators

### Backend Working:
```bash
# PM2 status shows "online"
pm2 status

# Health endpoint returns JSON
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"...","environment":"production"}

# API returns treatment data
curl http://localhost:3001/valeda/api/treatments
# Expected: {"data":[...],"pagination":{...}}
```

### Frontend Working:
- **Files served:** Browse to `http://oftalmonet.mx/valeda/`
- **API calls work:** Frontend can load treatment data
- **No CORS errors:** Check browser console

---

## Architecture Summary

### Separated Deployment:
- **Backend API:** `/var/www/html/valeda-api/` (Node.js + PM2)
- **Frontend:** `/var/www/oftalmonet.mx/valeda/` (Static files + Nginx)
- **Database:** MongoDB on localhost:27017
- **Proxy:** Nginx routes `/valeda/api/` to `localhost:3001`

### Key Benefits:
- ✅ **No npm install issues** (using working node_modules)
- ✅ **No Angular build complexity** on server
- ✅ **Lightweight backend** (only Express + Mongoose + CORS)
- ✅ **Modern frontend** (Angular 20 with SSR)

---

## Contact Info
- **Project:** Valeda Form (Angular 20 + MongoDB)
- **Server:** 104.248.69.154
- **Domain:** oftalmonet.mx/valeda/
- **API Port:** 3001

---

*Resume deployment when node_modules upload completes! 🚀*