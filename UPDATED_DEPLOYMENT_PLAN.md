# Updated Valeda Form Deployment Plan - Pure SPA Architecture

**Date:** 2025-08-25  
**Status:** Ready for deployment with separated SPA frontend and standalone backend  
**Architecture:** Pure SPA + Independent Express API

---

## Architecture Overview

### Separated Components:
- **Frontend**: Pure Angular SPA (Static files only)
- **Backend**: Standalone Express API with MongoDB
- **Database**: MongoDB on localhost:27017
- **Web Server**: Nginx (static files + API proxy)

### Key Benefits:
✅ **No SSR complexity** - Pure client-side rendering  
✅ **Independent scaling** - Frontend and backend deploy separately  
✅ **Simplified deployment** - Static files for frontend  
✅ **Better performance** - No hydration overhead  
✅ **Easier maintenance** - Clear separation of concerns  

---

## Next Steps for Deployment

### Phase 1: Backend API Deployment 🔧

#### 1.1. Complete Backend Upload (Resume from current status)
Your FileZilla upload of `node_modules` to `/var/www/html/valeda-api/` should be complete by now.

**Verification Steps:**
```bash
# SSH to server
ssh root@104.248.69.154

# Check backend files
cd /var/www/html/valeda-api
ls -la

# Verify node_modules size (should be substantial)
du -sh node_modules/
```

#### 1.2. Test Backend API
```bash
# Ensure Node.js 16 is active
nvm use 16
node --version  # Should show v16.20.2

# Start backend with PM2 (using corrected paths)
pm2 start ecosystem.config.js --env production --interpreter /root/.nvm/versions/node/v16.20.2/bin/node

# Check PM2 status
pm2 status

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/valeda/api/treatments
```

**Expected Success Indicators:**
- PM2 shows "online" status
- Health endpoint: `{"status":"ok","timestamp":"...","environment":"production"}`
- Treatments API returns: `{"data":[...],"pagination":{...}}`

### Phase 2: Frontend Deployment 📱

#### 2.1. Upload Updated Static Files
The frontend is now pure static files (no SSR). Upload these files via FileZilla:

**Local Source:** `deployment/valeda-frontend/`
**Server Destination:** `/var/www/oftalmonet.mx/valeda/`

**Files to upload:**
- `favicon.ico`
- `index.html` (updated SPA version)
- `logo-oftalmolaser-color.png`
- `main-WYFCIZYU.js` (updated SPA bundle)
- `polyfills-5CFQRCPP.js`
- `styles-5JHKKTCZ.css`

#### 2.2. Key Differences from Previous Build:
- ✅ **No SSR files** - Only static assets
- ✅ **Pure client-side** - No server-side rendering
- ✅ **Smaller complexity** - No hydration issues
- ✅ **Same file names** - Easy to replace existing files

### Phase 3: Server Configuration Update 🌐

#### 3.1. Update Nginx Configuration
The nginx configuration remains the same (already perfect for our architecture):

```nginx
# /etc/nginx/sites-available/oftalmonet.mx

location /valeda/ {
    alias /var/www/oftalmonet.mx/valeda/;
    try_files $uri $uri/ /valeda/index.html;
}

location /valeda/api/ {
    proxy_pass http://localhost:3001/valeda/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 3.2. Test and Reload Nginx
```bash
# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

---

## Deployment Verification

### Backend Verification:
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs valeda-api --lines 20

# Test health endpoint
curl http://localhost:3001/health

# Test treatments endpoint
curl http://localhost:3001/valeda/api/treatments
```

### Frontend Verification:
```bash
# Test static file serving
curl -I http://oftalmonet.mx/valeda/

# Check main application access
curl -I http://oftalmonet.mx/valeda/index.html
```

### Full Application Test:
1. Browse to: `http://oftalmonet.mx/valeda/`
2. Verify application loads (pure SPA)
3. Test treatment list loads from API
4. Test creating new treatment
5. Test editing existing treatment
6. Check browser console for errors (should be none)

---

## Troubleshooting Guide

### Backend Issues:
1. **PM2 not starting:**
   ```bash
   pm2 logs valeda-api --lines 50
   ```

2. **API endpoints not responding:**
   ```bash
   netstat -tlnp | grep 3001
   systemctl status mongod
   ```

3. **Database connection failed:**
   ```bash
   systemctl start mongod
   systemctl enable mongod
   ```

### Frontend Issues:
1. **404 errors:**
   - Check file paths in nginx configuration
   - Verify static files uploaded correctly

2. **API calls failing:**
   - Check nginx proxy configuration
   - Verify backend is running on port 3001

3. **CORS errors:**
   - Backend already configured for proper CORS
   - Check browser developer tools

---

## Production Environment Details

### Server Information:
- **Server IP:** 104.248.69.154
- **Domain:** oftalmonet.mx
- **Application URL:** http://oftalmonet.mx/valeda/
- **API Endpoint:** http://oftalmonet.mx/valeda/api/

### Architecture:
- **Frontend Path:** `/var/www/oftalmonet.mx/valeda/` (Static files)
- **Backend Path:** `/var/www/html/valeda-api/` (Node.js service)
- **Database:** MongoDB localhost:27017
- **Process Manager:** PM2 for backend API
- **Web Server:** Nginx (static serving + API proxy)

### Key Configuration Files:
- **PM2 Config:** `/var/www/html/valeda-api/ecosystem.config.js`
- **Nginx Config:** `/etc/nginx/sites-available/oftalmonet.mx`
- **API Environment:** Production (port 3001)

---

## Success Criteria

✅ **Backend API online** - PM2 shows running status  
✅ **Health endpoint responds** - Returns JSON status  
✅ **Treatments API works** - Returns treatment data  
✅ **Frontend serves** - Static files load correctly  
✅ **API calls work** - Frontend communicates with backend  
✅ **No console errors** - Clean browser console  
✅ **Full functionality** - Create, read, update treatments  

---

## Post-Deployment Maintenance

### Monitoring:
```bash
# Check PM2 status
pm2 status

# Monitor logs
pm2 logs valeda-api --follow

# Check disk space
df -h
```

### Updates:
- **Frontend updates:** Replace static files in `/var/www/oftalmonet.mx/valeda/`
- **Backend updates:** Replace files in `/var/www/html/valeda-api/` and restart PM2
- **Database:** Automatic via MongoDB

---

**Ready to proceed with deployment! 🚀**

The architecture is now clean, separated, and production-ready with no SSR complexity.