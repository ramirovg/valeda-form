# 🚀 Valeda Form Production Deployment Plan

## 📋 **Deployment Overview**
- **Domain**: `oftalmonet.mx/valeda` (subfolder deployment)
- **API**: Port 3001 (avoiding your used ports 8080, 3000)
- **Architecture**: Angular SSR app + Express API server + MongoDB
- **Server**: DigitalOcean with existing infrastructure

## 🔧 **Phase 1: Angular Build Configuration**

### 1.1 Configure Base Href for Subfolder
- Update `angular.json` to set base href to `/valeda/`
- Modify build configurations for production deployment
- Update routing to work with subfolder path

### 1.2 Environment Configuration  
- Create production environment file
- Configure API URLs for production (using port 3001)
- Set up MongoDB connection string for production

### 1.3 Build Scripts Enhancement
- Update package.json with production build scripts
- Create deployment-specific build command
- Add server compilation for production

## 🖥️ **Phase 2: Server Configuration**

### 2.1 API Server Port Configuration
- Configure API server to run on port 3001 (avoiding 8080, 3000)  
- Update CORS settings for production domain
- Configure Express static file serving

### 2.2 Production Server Setup
- Create production server startup script
- Configure process management (PM2)
- Set up environment variables

### 2.3 MongoDB Production Configuration
- Update database connection for production
- Configure proper error handling and logging
- Set up database backup considerations

## 🌐 **Phase 3: Web Server Integration** 

### 3.1 Nginx Configuration
- Configure reverse proxy for `/valeda/` path
- Set up API proxy to port 3001
- Configure static file serving
- Enable gzip compression

### 3.2 SSL and Security
- Ensure HTTPS works for subfolder
- Configure security headers
- Set up proper CORS for production

## 📦 **Phase 4: Deployment Automation**

### 4.1 Build and Deploy Scripts
- Create deployment automation script
- Set up file transfer process
- Configure service restart procedures

### 4.2 Environment Management
- Create production environment variables
- Set up configuration for different environments
- Configure logging for production

## 🔍 **Phase 5: Testing and Monitoring**

### 5.1 Deployment Verification
- Test all application features in subfolder
- Verify API connectivity
- Test MongoDB operations

### 5.2 Production Monitoring
- Set up basic health checks
- Configure error logging
- Monitor application performance

## 📁 **Expected File Structure on Server**
```
/var/www/oftalmonet.mx/
├── valeda/                    # Angular app files
│   ├── browser/              # Client-side files  
│   ├── server/               # SSR server files
│   └── api/                  # API server files
├── nginx/                    # Nginx configuration
└── scripts/                  # Deployment scripts
```

## 🎯 **Final Architecture**
- **Frontend**: `https://oftalmonet.mx/valeda/` (Angular SSR)
- **API**: `https://oftalmonet.mx/valeda/api/` (proxied to port 3001)
- **Database**: MongoDB (existing or new instance)
- **Process Management**: PM2 for API server
- **Web Server**: Nginx reverse proxy

## 📝 **Implementation Notes**
- Current application is working perfectly for both new treatment creation and existing treatment updates
- Session synchronization between UI and reactive forms is functioning correctly
- MongoDB integration handles both `_id` and `id` fields properly
- Form validation and auto-save features are operational

## 🚀 **Deployment Instructions**

### **Quick Start (Windows)**
```bash
# Build and create deployment package
deploy.bat

# Upload 'deployment' directory to server
scp -r deployment/ root@your-server:/var/www/oftalmonet.mx/valeda/
```

### **Detailed Server Setup**

#### **1. Server Preparation**
```bash
# On DigitalOcean server
sudo mkdir -p /var/www/oftalmonet.mx/valeda
sudo mkdir -p /var/log/pm2
sudo chown -R www-data:www-data /var/www/oftalmonet.mx/valeda

# Install Node.js and PM2 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Install MongoDB (if not already installed)
# Follow MongoDB installation guide for Ubuntu/Debian
```

#### **2. Deploy Application**
```bash
# Upload and extract deployment package
cd /var/www/oftalmonet.mx/valeda/
sudo tar -xzf valeda-form-deployment.tar.gz

# Install dependencies
sudo -u www-data npm install --only=prod

# Set up environment variables
sudo cp .env.template .env
sudo nano .env  # Edit with your production values

# Start with PM2
sudo -u www-data pm2 start ecosystem.config.js --env production
sudo -u www-data pm2 save
sudo pm2 startup
```

#### **3. Configure Nginx**
```bash
# Copy Nginx configuration
sudo cp nginx/valeda.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/valeda.conf /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### **4. Verify Deployment**
- API Health: `http://your-server:3001/health`
- Application: `https://oftalmonet.mx/valeda/`
- PM2 Status: `pm2 list`
- Logs: `pm2 logs valeda-form-api`

### **Environment Variables**
Copy `.env.template` to `.env` and configure:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/valeda-treatments-prod
DOMAIN=oftalmonet.mx
```

### **Monitoring & Maintenance**
```bash
# View logs
pm2 logs valeda-form-api

# Restart application
pm2 restart valeda-form-api

# Monitor resources
pm2 monit

# Update application
./deploy.sh production
```

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Port 3001 in use**: Change PORT in .env file
2. **MongoDB connection failed**: Check MONGODB_URI and service status
3. **Nginx 404**: Verify file paths and permissions
4. **PM2 not starting**: Check logs and file permissions

### **File Permissions**
```bash
sudo chown -R www-data:www-data /var/www/oftalmonet.mx/valeda
sudo chmod -R 755 /var/www/oftalmonet.mx/valeda
sudo chmod +x /var/www/oftalmonet.mx/valeda/server-production.js
```