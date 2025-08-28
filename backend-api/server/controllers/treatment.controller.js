"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentController = void 0;
const treatment_service_1 = require("../services/treatment.service");
class TreatmentController {
    /**
     * GET /api/treatments - Get all treatments (with optional search filters)
     */
    static async getAllTreatments(req, res) {
        try {
            // Check if any search filters are present
            const hasSearchFilters = req.query['name'] || req.query['doctor'] || req.query['treatmentType'] || req.query['dateFrom'] || req.query['dateTo'];
            const paginationOptions = {
                page: parseInt(req.query['page']) || 1,
                limit: parseInt(req.query['limit']) || 50,
                sortBy: req.query['sortBy'] || 'lastModified',
                sortOrder: req.query['sortOrder'] || 'desc'
            };
            let result;
            if (hasSearchFilters) {
                // Use search functionality if filters are present
                const qFilters = {
                    name: req.query['name'],
                    doctor: req.query['doctor'],
                    treatmentType: req.query['treatmentType'],
                    dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom']) : undefined,
                    dateTo: req.query['dateTo'] ? new Date(req.query['dateTo']) : undefined
                };
                // Remove undefined values
                Object.keys(qFilters).forEach(key => {
                    if (qFilters[key] === undefined) {
                        delete qFilters[key];
                    }
                });
                console.log('🔍 Searching treatments with filters:', qFilters);
                result = await treatment_service_1.TreatmentService.searchTreatments(qFilters, paginationOptions);
            }
            else {
                // Return all treatments if no filters
                result = await treatment_service_1.TreatmentService.getAllTreatments(paginationOptions);
            }
            // Disable caching for search results to prevent 304 responses
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.json(result);
        }
        catch (error) {
            console.error('Error getting treatments:', error);
            res.status(500).json({
                error: 'Failed to load treatments',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/treatments/search - Search treatments
     */
    static async searchTreatments(req, res) {
        try {
            const searchFilters = {
                name: req.query['name'],
                doctor: req.query['doctor'],
                treatmentType: req.query['treatmentType'],
                dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom']) : undefined,
                dateTo: req.query['dateTo'] ? new Date(req.query['dateTo']) : undefined
            };
            // Remove undefined values
            Object.keys(searchFilters).forEach(key => {
                if (searchFilters[key] === undefined) {
                    delete searchFilters[key];
                }
            });
            const paginationOptions = {
                page: parseInt(req.query['page']) || 1,
                limit: parseInt(req.query['limit']) || 50,
                sortBy: req.query['sortBy'] || 'lastModified',
                sortOrder: req.query['sortOrder'] || 'desc'
            };
            const result = await treatment_service_1.TreatmentService.searchTreatments(searchFilters, paginationOptions);
            res.json(result);
        }
        catch (error) {
            console.error('Error searching treatments:', error);
            res.status(500).json({
                error: 'Failed to search treatments',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/treatments/:id - Get treatment by ID
     */
    static async getTreatmentById(req, res) {
        try {
            const { id } = req.params;
            const treatment = await treatment_service_1.TreatmentService.getTreatmentById(id);
            if (!treatment) {
                res.status(404).json({ error: 'Treatment not found' });
                return;
            }
            res.json(treatment);
        }
        catch (error) {
            console.error('Error getting treatment:', error);
            res.status(500).json({
                error: 'Failed to load treatment',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/treatments - Create new treatment
     */
    static async createTreatment(req, res) {
        try {
            const treatmentData = req.body;
            // Validate required fields
            if (!treatmentData.patient?.name || !treatmentData.doctor?.name || !treatmentData.treatmentType) {
                res.status(400).json({
                    error: 'Missing required fields',
                    required: ['patient.name', 'doctor.name', 'treatmentType']
                });
                return;
            }
            // Initialize sessions if not provided
            if (!treatmentData.sessions || treatmentData.sessions.length === 0) {
                treatmentData.sessions = treatment_service_1.TreatmentService.initializeSessions();
            }
            const treatment = await treatment_service_1.TreatmentService.createTreatment(treatmentData);
            res.status(201).json(treatment);
        }
        catch (error) {
            console.error('Error creating treatment:', error);
            if (error instanceof Error && error.name === 'ValidationError') {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.message
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to create treatment',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * PUT /api/treatments/:id - Update treatment
     */
    static async updateTreatment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const treatment = await treatment_service_1.TreatmentService.updateTreatment(id, updateData);
            if (!treatment) {
                res.status(404).json({ error: 'Treatment not found' });
                return;
            }
            res.json(treatment);
        }
        catch (error) {
            console.error('Error updating treatment:', error);
            if (error instanceof Error && error.name === 'ValidationError') {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.message
                });
            }
            else if (error instanceof Error && error.name === 'CastError') {
                res.status(400).json({
                    error: 'Invalid treatment ID format'
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to update treatment',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * DELETE /api/treatments/:id - Delete treatment
     */
    static async deleteTreatment(req, res) {
        try {
            const { id } = req.params;
            const success = await treatment_service_1.TreatmentService.deleteTreatment(id);
            if (!success) {
                res.status(404).json({ error: 'Treatment not found' });
                return;
            }
            res.json({ message: 'Treatment deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting treatment:', error);
            if (error instanceof Error && error.name === 'CastError') {
                res.status(400).json({
                    error: 'Invalid treatment ID format'
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to delete treatment',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * GET /api/treatments/statistics - Get treatment statistics
     */
    static async getStatistics(_req, res) {
        try {
            const statistics = await treatment_service_1.TreatmentService.getStatistics();
            res.json(statistics);
        }
        catch (error) {
            console.error('Error getting treatment statistics:', error);
            res.status(500).json({
                error: 'Failed to get treatment statistics',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.TreatmentController = TreatmentController;
//# sourceMappingURL=treatment.controller.js.map