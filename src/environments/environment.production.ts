// Production environment
export const environment = {
  production: true,
  apiUrl: '/valeda/api', // Will be proxied by Nginx to port 3001
  mongodbUri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/valeda-treatments-prod',
  enableLogging: false,
  enableAutoSave: true,
  autoSaveInterval: 2000, // milliseconds (slightly longer for production)
  applicationName: 'Valeda Form - Oftalmo Laser',
  version: '1.0.0',
  features: {
    enableOfflineMode: false,
    enableAdvancedSearch: true,
    enableExportFeatures: true
  },
  deployment: {
    domain: 'oftalmonet.mx',
    path: '/valeda',
    apiPort: 3001,
    server: 'DigitalOcean',
    deploymentDate: new Date().toISOString()
  }
};