import { Router } from 'express';
import { TreatmentController } from '../controllers/treatment.controller';

const router = Router();

// GET /api/treatments/statistics - Get treatment statistics (must be before /:id route)
router.get('/statistics', TreatmentController.getStatistics);

// GET /api/treatments/search - Search treatments
router.get('/search', TreatmentController.searchTreatments);

// GET /api/treatments - Get all treatments
router.get('/', TreatmentController.getAllTreatments);

// GET /api/treatments/:id - Get treatment by ID
router.get('/:id', TreatmentController.getTreatmentById);

// POST /api/treatments - Create new treatment
router.post('/', TreatmentController.createTreatment);

// PUT /api/treatments/:id - Update treatment
router.put('/:id', TreatmentController.updateTreatment);

// DELETE /api/treatments/:id - Delete treatment
router.delete('/:id', TreatmentController.deleteTreatment);

export { router as treatmentRoutes };