/**
 * PM2 Ecosystem Configuration for Valeda Backend API
 * Production deployment configuration for separated backend API
 */
module.exports = {
  apps: [
    {
      name: 'valeda-api',
      script: 'server-production.js',
      cwd: '/var/www/html/valeda-api',
      exec_mode: 'fork',
      interpreter: '/root/.nvm/versions/node/v16.20.2/bin/node',
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
      error_file: '/var/log/pm2/valeda-api-error.log',
      out_file: '/var/log/pm2/valeda-api-out.log',
      log_file: '/var/log/pm2/valeda-api.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: '104.248.69.154',
      ref: 'origin/deployment/production-setup',
      repo: 'https://github.com/ramirovg/valeda-form.git',
      path: '/var/www/html/valeda-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};