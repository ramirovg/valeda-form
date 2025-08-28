"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = void 0;
const express_1 = require("express");
const treatment_routes_1 = require("./treatment.routes");
const doctor_routes_1 = require("./doctor.routes");
const database_config_1 = require("../config/database.config");
const router = (0, express_1.Router)();
exports.apiRoutes = router;
// Health check endpoint
router.get('/health', async (_req, res) => {
    try {
        const healthCheck = await database_config_1.databaseService.healthCheck();
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
        }
        else {
            res.json(response);
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'Valeda Treatment API',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// API version endpoint
router.get('/version', (_req, res) => {
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
router.use('/treatments', treatment_routes_1.treatmentRoutes);
router.use('/doctors', doctor_routes_1.doctorRoutes);
//# sourceMappingURL=index.js.map