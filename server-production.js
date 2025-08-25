/**
 * Production Server for Valeda Form
 * Serves both SSR Angular app and API endpoints
 * Configured for deployment at oftalmonet.mx/valeda/
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import compiled server modules
const { databaseService } = require('./server/config/database.config.js');
const { apiRoutes } = require('./server/routes/index.js');
const { errorHandler, requestLogger } = require('./server/middleware/validation.middleware.js');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Production MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/valeda-treatments-prod';

// Middleware
app.use(cors({
  origin: [
    'https://oftalmonet.mx',
    'http://oftalmonet.mx',
    'http://localhost:4200',
    'http://localhost:4201'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers for production
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging in development
if (NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Initialize database connection
databaseService.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📍 Database: ${MONGODB_URI}`);
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error.message);
  console.log('📝 Check MongoDB connection string and server status');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT,
    message: 'Valeda Form API server is running'
  });
});

// API Routes - prefix with /valeda/api for production
app.use('/valeda/api', apiRoutes);

// Serve static files from Angular build (for subfolder deployment)
app.use('/valeda', express.static(path.join(__dirname, 'browser')));

// SSR support for Angular routes within /valeda path
app.get('/valeda/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'browser/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/valeda/api/')) {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.originalUrl,
      availableEndpoints: [
        '/valeda/api/treatments',
        '/valeda/api/doctors/sample',
        '/health'
      ]
    });
  } else {
    res.status(404).send('Page not found');
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 Valeda Form Production Server Started!
📍 Environment: ${NODE_ENV}
🌐 Frontend: Available at /valeda/ (served by Nginx)
📊 API endpoints: http://localhost:${PORT}/valeda/api
🩺 Health check: http://localhost:${PORT}/health
💾 Database: MongoDB with Mongoose ODM
🔒 CORS: Configured for oftalmonet.mx domain

Production Configuration:
• Base path: /valeda/
• API proxy: Nginx → http://localhost:${PORT}/valeda/api
• Static files: Served from ./browser/
• Database: ${MONGODB_URI}
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down production server...`);

  try {
    await databaseService.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));