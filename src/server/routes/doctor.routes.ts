import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';

const router = Router();

// GET /api/doctors/sample - Get or create sample doctors (must be before /:id route)
router.get('/sample', DoctorController.getSampleDoctors);

// GET /api/doctors/search - Search doctors
router.get('/search', DoctorController.searchDoctors);

// GET /api/doctors - Get all active doctors
router.get('/', DoctorController.getAllDoctors);

// POST /api/doctors - Create new doctor
router.post('/', DoctorController.createDoctor);

// PUT /api/doctors/:id - Update doctor
router.put('/:id', DoctorController.updateDoctor);

// DELETE /api/doctors/:id - Soft delete doctor
router.delete('/:id', DoctorController.deleteDoctor);

export { router as doctorRoutes };