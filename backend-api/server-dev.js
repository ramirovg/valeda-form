/**
 * Development API Server
 * Runs the MongoDB API endpoints independently for development
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import compiled server modules
const { databaseService } = require('./server/config/database.config.js');
const { apiRoutes } = require('./server/routes/index.js');
const { errorHandler, requestLogger } = require('./server/middleware/validation.middleware.js');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Initialize database connection
databaseService.connect().then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error.message);
  console.log('📝 Make sure MongoDB is running and connection string is correct');
  // Continue running for development even without DB
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/api/treatments',
      '/api/doctors/sample'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 Development API Server started!
📍 API endpoints: http://localhost:${PORT}/api
📊 Health check: http://localhost:${PORT}/health
💾 Database: MongoDB with Mongoose ODM
🔧 Environment: Development

Available endpoints:
• GET    /api/treatments - List treatments
• POST   /api/treatments - Create treatment
• GET    /api/treatments/:id - Get treatment
• PUT    /api/treatments/:id - Update treatment
• DELETE /api/treatments/:id - Delete treatment
• GET    /api/doctors/sample - Get sample doctors
• GET    /health - Health check
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down API server...`);

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
