"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorRoutes = void 0;
const express_1 = require("express");
const doctor_controller_1 = require("../controllers/doctor.controller");
const router = (0, express_1.Router)();
exports.doctorRoutes = router;
// GET /api/doctors/sample - Get or create sample doctors (must be before /:id route)
router.get('/sample', doctor_controller_1.DoctorController.getSampleDoctors);
// GET /api/doctors/search - Search doctors
router.get('/search', doctor_controller_1.DoctorController.searchDoctors);
// GET /api/doctors - Get all active doctors
router.get('/', doctor_controller_1.DoctorController.getAllDoctors);
// POST /api/doctors - Create new doctor
router.post('/', doctor_controller_1.DoctorController.createDoctor);
// PUT /api/doctors/:id - Update doctor
router.put('/:id', doctor_controller_1.DoctorController.updateDoctor);
// DELETE /api/doctors/:id - Soft delete doctor
router.delete('/:id', doctor_controller_1.DoctorController.deleteDoctor);
//# sourceMappingURL=doctor.routes.js.map