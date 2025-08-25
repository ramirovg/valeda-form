// Default environment (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api',
  mongodbUri: 'mongodb://localhost:27017/valeda-treatments',
  enableLogging: true,
  enableAutoSave: true,
  autoSaveInterval: 1000, // milliseconds
  applicationName: 'Valeda Form - Development',
  version: '1.0.0',
  features: {
    enableOfflineMode: false,
    enableAdvancedSearch: true,
    enableExportFeatures: true
  }
};