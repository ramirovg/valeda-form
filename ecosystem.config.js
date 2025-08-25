/**
 * PM2 Ecosystem Configuration for Valeda Form
 * Production deployment configuration for DigitalOcean server
 */
module.exports = {
  apps: [
    {
      name: 'valeda-form-api',
      script: 'dist/valeda-form/server-production.js',
      cwd: '/var/www/oftalmonet.mx/valeda',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/valeda-treatments'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/valeda-treatments-prod'
      },
      error_file: '/var/log/pm2/valeda-form-error.log',
      out_file: '/var/log/pm2/valeda-form-out.log',
      log_file: '/var/log/pm2/valeda-form.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-digitalocean-server-ip',
      ref: 'origin/deployment/production-setup',
      repo: 'https://github.com/your-username/valeda-form.git',
      path: '/var/www/oftalmonet.mx/valeda',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};