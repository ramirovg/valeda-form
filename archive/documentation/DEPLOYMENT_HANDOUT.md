# 🚀 Valeda Form Deployment Handout

**Server**: 104.248.69.154 (DigitalOcean)  
**Domain**: oftalmonet.mx/valeda  
**API Port**: 3001  
**Date**: $(date)

---

## 📋 **Pre-Deployment Checklist**

### **Required on Development Machine:**
- [x] Node.js and npm installed
- [x] Project built successfully
- [x] Git repository committed
- [x] SSH access to server configured

### **Required on Server (104.248.69.154):**
- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] SSL certificate for oftalmonet.mx

---

## 🛠️ **Step 1: Build Deployment Package**

### **On Your Development Machine:**
```bash
# Navigate to project directory
cd /c/Users/ramir/WebstormProjects/Oftalmolaser/valeda-form

# Build deployment package
deploy.bat

# Package will be created in 'deployment' directory
```

### **Files Created:**
```
deployment/
├── dist/valeda-form/          # Built Angular application
├── server-production.js       # Production API server
├── ecosystem.config.js        # PM2 configuration
├── package.json              # Dependencies
├── .env.template             # Environment variables template
└── nginx/valeda.conf         # Nginx configuration
```

---

## 🌐 **Step 2: Server Preparation**

### **Connect to Server:**
```bash
ssh root@104.248.69.154
```

### **Install Required Software:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB (if not already installed)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create application directories
sudo mkdir -p /var/www/oftalmonet.mx/valeda
sudo mkdir -p /var/log/pm2
sudo chown -R www-data:www-data /var/www/oftalmonet.mx/valeda
```

---

## 📦 **Step 3: Deploy Application**

### **Transfer Files to Server:**
```bash
# From your development machine
scp -r deployment/* root@104.248.69.154:/tmp/valeda-deployment/

# On server - move to proper location
ssh root@104.248.69.154
cd /tmp/valeda-deployment
sudo cp -r * /var/www/oftalmonet.mx/valeda/
sudo chown -R www-data:www-data /var/www/oftalmonet.mx/valeda
```

### **Setup Application on Server:**
```bash
# Navigate to application directory
cd /var/www/oftalmonet.mx/valeda

# Install production dependencies
sudo -u www-data npm install --only=prod

# Configure environment variables
sudo cp .env.template .env
sudo nano .env
```

### **Edit .env file with these values:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/valeda-treatments-prod
DOMAIN=oftalmonet.mx
BASE_PATH=/valeda
ALLOWED_ORIGINS=https://oftalmonet.mx,http://oftalmonet.mx
```

### **Start Application with PM2:**
```bash
# Start the application
sudo -u www-data pm2 start ecosystem.config.js --env production

# Save PM2 configuration
sudo -u www-data pm2 save

# Setup PM2 to start on boot
sudo pm2 startup
# Follow the instructions provided by the command above
```

---

## 🌐 **Step 4: Configure Nginx**

### **Install Nginx (if not already installed):**
```bash
sudo apt install nginx -y
```

### **Configure Nginx for Valeda:**
```bash
# Copy nginx configuration
sudo cp nginx/valeda.conf /etc/nginx/sites-available/valeda

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/valeda /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **Update Main Nginx Configuration:**
Add this to your main server block in `/etc/nginx/sites-available/default` or your domain configuration:

```nginx
# Add inside your existing server block for oftalmonet.mx
location /valeda/ {
    alias /var/www/oftalmonet.mx/valeda/dist/valeda-form/browser/;
    try_files $uri $uri/ @valeda_fallback;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

location @valeda_fallback {
    rewrite ^/valeda(.*)$ /valeda/index.html last;
}

location /valeda/api/ {
    proxy_pass http://127.0.0.1:3001/valeda/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ✅ **Step 5: Verification**

### **Check Services:**
```bash
# Check PM2 status
sudo -u www-data pm2 list

# Check application logs
sudo -u www-data pm2 logs valeda-form-api

# Check if API is responding
curl http://localhost:3001/health

# Check MongoDB status
sudo systemctl status mongod

# Check Nginx status
sudo systemctl status nginx
```

### **Test Access:**
- **Frontend**: https://oftalmonet.mx/valeda/
- **API Health**: http://104.248.69.154:3001/health
- **Direct API**: https://oftalmonet.mx/valeda/api/treatments

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions:**

#### **Port 3001 in Use:**
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>

# Or change port in .env file
```

#### **Permission Issues:**
```bash
sudo chown -R www-data:www-data /var/www/oftalmonet.mx/valeda
sudo chmod -R 755 /var/www/oftalmonet.mx/valeda
```

#### **MongoDB Connection Failed:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

#### **Nginx 404 Error:**
```bash
# Check file paths
ls -la /var/www/oftalmonet.mx/valeda/dist/valeda-form/browser/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### **PM2 Application Not Starting:**
```bash
# Check PM2 logs
sudo -u www-data pm2 logs valeda-form-api --lines 50

# Restart application
sudo -u www-data pm2 restart valeda-form-api

# Check environment variables
sudo -u www-data pm2 show valeda-form-api
```

---

## 📊 **Post-Deployment Monitoring**

### **Useful Commands:**
```bash
# Monitor PM2 processes
sudo -u www-data pm2 monit

# View application logs
sudo -u www-data pm2 logs valeda-form-api

# Restart application
sudo -u www-data pm2 restart valeda-form-api

# Check resource usage
htop

# Monitor Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check disk usage
df -h
```

---

## 🔄 **Future Updates**

### **To Update the Application:**
1. Build new version on development machine: `deploy.bat`
2. Transfer files to server: `scp -r deployment/* root@104.248.69.154:/tmp/valeda-update/`
3. On server: Stop PM2 → Copy files → Start PM2
4. Test functionality

### **Backup Recommendation:**
```bash
# Create backup script
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * mongodump --out /var/backups/mongodb-$(date +\%Y\%m\%d)
```

---

## 📞 **Quick Reference**

**Server IP**: 104.248.69.154  
**Application URL**: https://oftalmonet.mx/valeda/  
**API URL**: https://oftalmonet.mx/valeda/api/  
**Log Location**: PM2 logs via `pm2 logs valeda-form-api`  
**Restart Command**: `sudo -u www-data pm2 restart valeda-form-api`

---

## 🎯 **Success Criteria**
- [ ] Application accessible at https://oftalmonet.mx/valeda/
- [ ] Can create new treatments
- [ ] Can edit existing treatments  
- [ ] Session data saves properly
- [ ] API endpoints responding
- [ ] PM2 shows application as online
- [ ] No errors in logs

**Happy Deploying! 🚀**