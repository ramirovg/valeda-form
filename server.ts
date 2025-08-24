import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express, { Express } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// Import modular server components
import { databaseService } from './src/server/config/database.config';
import { apiRoutes } from './src/server/routes/index';
import { errorHandler, requestLogger } from './src/server/middleware/validation.middleware';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Middleware
  server.use(express.json({ limit: '10mb' }));
  server.use(express.urlencoded({ extended: true }));
  
  // Development logging
  if (process.env['NODE_ENV'] !== 'production') {
    server.use(requestLogger);
  }

  // Initialize database connection
  databaseService.connect().catch(error => {
    console.error('❌ Failed to connect to MongoDB:', error);
    // Continue running but log the error
  });

  // API Routes
  server.use('/api', apiRoutes);

  // Legacy compatibility - redirect old endpoints
  server.get('/api/doctors', (req, res, next) => {
    // This is now handled by the modular routes
    next();
  });

  // Error handling middleware (must be after routes)
  server.use(errorHandler);

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  
  server.listen(port, () => {
    console.log(`
🚀 Server started successfully!
📍 Node Express server listening on http://localhost:${port}
🔗 API endpoints available at http://localhost:${port}/api
📊 Health check: http://localhost:${port}/api/health
📖 API docs: http://localhost:${port}/api/version

💾 Database: MongoDB with Mongoose ODM
🗂️  Collections: treatments, doctors
🔍 Search: Full-text search with indexing
📈 Features: CRUD operations, statistics, validation

🎯 Ready to serve Valeda Treatment requests!
    `);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
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
}

run();