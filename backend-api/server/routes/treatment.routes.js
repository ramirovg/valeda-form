"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treatmentRoutes = void 0;
const express_1 = require("express");
const treatment_controller_1 = require("../controllers/treatment.controller");
const router = (0, express_1.Router)();
exports.treatmentRoutes = router;
// GET /api/treatments/statistics - Get treatment statistics (must be before /:id route)
router.get('/statistics', treatment_controller_1.TreatmentController.getStatistics);
// GET /api/treatments/search - Search treatments
router.get('/search', treatment_controller_1.TreatmentController.searchTreatments);
// GET /api/treatments - Get all treatments
router.get('/', treatment_controller_1.TreatmentController.getAllTreatments);
// GET /api/treatments/:id - Get treatment by ID
router.get('/:id', treatment_controller_1.TreatmentController.getTreatmentById);
// POST /api/treatments - Create new treatment
router.post('/', treatment_controller_1.TreatmentController.createTreatment);
// PUT /api/treatments/:id - Update treatment
router.put('/:id', treatment_controller_1.TreatmentController.updateTreatment);
// DELETE /api/treatments/:id - Delete treatment
router.delete('/:id', treatment_controller_1.TreatmentController.deleteTreatment);
//# sourceMappingURL=treatment.routes.js.map