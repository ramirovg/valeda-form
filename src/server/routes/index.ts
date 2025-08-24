import { Router } from 'express';
import { treatmentRoutes } from './treatment.routes';
import { doctorRoutes } from './doctor.routes';
import { databaseService } from '../config/database.config';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await databaseService.healthCheck();
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Valeda Treatment API',
      version: '2.0.0',
      database: healthCheck
    };

    if (healthCheck.status === 'error') {
      res.status(503).json({
        ...response,
        status: 'unhealthy'
      });
    } else {
      res.json(response);
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Valeda Treatment API',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API version endpoint
router.get('/version', (req, res) => {
  res.json({
    name: 'Valeda Treatment API',
    version: '2.0.0',
    description: 'REST API for Valeda Photobiomodulation Treatments',
    features: [
      'MongoDB integration',
      'Full CRUD operations',
      'Advanced search and filtering',
      'Treatment session management',
      'Doctor management',
      'Statistics and analytics',
      'Data validation',
      'Error handling'
    ],
    endpoints: {
      treatments: '/api/treatments',
      doctors: '/api/doctors',
      health: '/api/health'
    }
  });
});

// Mount route modules
router.use('/treatments', treatmentRoutes);
router.use('/doctors', doctorRoutes);

export { router as apiRoutes };