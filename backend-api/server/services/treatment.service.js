"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentService = void 0;
const treatment_model_1 = require("../models/treatment.model");
class TreatmentService {
    /**
     * Get all treatments with optional pagination
     */
    static async getAllTreatments(options = {}) {
        const { page = 1, limit = 50, sortBy = 'lastModified', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const [treatments, totalItems] = await Promise.all([
            treatment_model_1.Treatment.find({})
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            treatment_model_1.Treatment.countDocuments({})
        ]);
        return {
            data: treatments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };
    }
    /**
     * Search treatments by filters
     */
    static async searchTreatments(filters, options = {}) {
        const query = {};
        // Build search query
        if (filters.name) {
            query['patient.name'] = new RegExp(filters.name, 'i');
        }
        if (filters.doctor) {
            query['doctor.name'] = new RegExp(filters.doctor, 'i');
        }
        if (filters.treatmentType) {
            query.treatmentType = filters.treatmentType;
        }
        if (filters.dateFrom || filters.dateTo) {
            query.creationDate = {};
            if (filters.dateFrom) {
                query.creationDate.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                query.creationDate.$lte = filters.dateTo;
            }
        }
        const { page = 1, limit = 50, sortBy = 'lastModified', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const [treatments, totalItems] = await Promise.all([
            treatment_model_1.Treatment.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            treatment_model_1.Treatment.countDocuments(query)
        ]);
        return {
            data: treatments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };
    }
    /**
     * Get treatment by ID
     */
    static async getTreatmentById(id) {
        try {
            const treatment = await treatment_model_1.Treatment.findById(id).lean();
            return treatment;
        }
        catch (error) {
            console.error(`Error finding treatment ${id}:`, error);
            return null;
        }
    }
    /**
     * Create new treatment
     */
    static async createTreatment(treatmentData) {
        try {
            const treatment = new treatment_model_1.Treatment(treatmentData);
            await treatment.save();
            console.log('🏥 Created new treatment:', {
                id: treatment.id,
                patient: treatment.patient.name,
                doctor: treatment.doctor.name,
                sessionsCount: treatment.sessions.length
            });
            return treatment;
        }
        catch (error) {
            console.error('Error creating treatment:', error);
            throw error;
        }
    }
    /**
     * Update existing treatment
     */
    static async updateTreatment(id, updateData) {
        try {
            const treatment = await treatment_model_1.Treatment.findByIdAndUpdate(id, { ...updateData, lastModified: new Date() }, { new: true, runValidators: true });
            if (treatment) {
                console.log('💾 Updated treatment:', {
                    id: treatment.id,
                    patient: treatment.patient.name,
                    sessionsWithData: treatment.sessions.filter(s => s.technician || s.time || s.date).length
                });
            }
            return treatment;
        }
        catch (error) {
            console.error(`Error updating treatment ${id}:`, error);
            throw error;
        }
    }
    /**
     * Delete treatment
     */
    static async deleteTreatment(id) {
        try {
            const result = await treatment_model_1.Treatment.findByIdAndDelete(id);
            if (result) {
                console.log('🗑️ Deleted treatment:', {
                    id: result.id,
                    patient: result.patient.name
                });
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Error deleting treatment ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get treatment statistics
     */
    static async getStatistics() {
        try {
            const [totalTreatments, treatmentsByType, treatments] = await Promise.all([
                treatment_model_1.Treatment.countDocuments(),
                treatment_model_1.Treatment.aggregate([
                    { $group: { _id: '$treatmentType', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                treatment_model_1.Treatment.find({}, 'sessions').lean()
            ]);
            const typeStats = treatmentsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});
            const completedSessions = treatments.reduce((total, treatment) => {
                return total + treatment.sessions.filter((s) => s.date).length;
            }, 0);
            const averageSessionsPerTreatment = totalTreatments > 0
                ? Math.round((completedSessions / totalTreatments) * 100) / 100
                : 0;
            return {
                totalTreatments,
                treatmentsByType: typeStats,
                completedSessions,
                averageSessionsPerTreatment
            };
        }
        catch (error) {
            console.error('Error getting treatment statistics:', error);
            throw error;
        }
    }
    /**
     * Initialize sessions for new treatment
     */
    static initializeSessions() {
        return Array.from({ length: 9 }, (_, index) => ({
            sessionNumber: index + 1,
            technician: '',
            time: ''
        }));
    }
}
exports.TreatmentService = TreatmentService;
//# sourceMappingURL=treatment.service.js.map