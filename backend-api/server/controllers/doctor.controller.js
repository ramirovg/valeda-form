"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const doctor_model_1 = require("../models/doctor.model");
class DoctorController {
    /**
     * GET /api/doctors - Get all active doctors
     */
    static async getAllDoctors(_req, res) {
        try {
            const doctors = await doctor_model_1.Doctor.find({ isActive: true })
                .sort({ name: 1 })
                .lean();
            res.json(doctors);
        }
        catch (error) {
            console.error('Error getting doctors:', error);
            res.status(500).json({
                error: 'Failed to load doctors',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/doctors/sample - Get or create sample doctors
     */
    static async getSampleDoctors(_req, res) {
        try {
            // This will create sample doctors if they don't exist
            const doctors = await doctor_model_1.Doctor.getSampleDoctors();
            res.json(doctors);
        }
        catch (error) {
            console.error('Error getting sample doctors:', error);
            res.status(500).json({
                error: 'Failed to load sample doctors',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/doctors - Create new doctor
     */
    static async createDoctor(req, res) {
        try {
            const { name, specialization } = req.body;
            if (!name) {
                res.status(400).json({
                    error: 'Missing required field: name'
                });
                return;
            }
            const doctor = new doctor_model_1.Doctor({
                name: name.trim(),
                specialization: specialization?.trim() || 'Oftalmología'
            });
            await doctor.save();
            console.log('👨‍⚕️ Created new doctor:', {
                id: doctor.id,
                name: doctor.name,
                specialization: doctor.specialization
            });
            res.status(201).json(doctor);
        }
        catch (error) {
            console.error('Error creating doctor:', error);
            if (error instanceof Error && error.name === 'ValidationError') {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.message
                });
            }
            else if (error instanceof Error && error.code === 11000) {
                res.status(409).json({
                    error: 'Doctor with this name already exists'
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to create doctor',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * PUT /api/doctors/:id - Update doctor
     */
    static async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const { name, specialization, isActive } = req.body;
            const updateData = {};
            if (name !== undefined)
                updateData.name = name.trim();
            if (specialization !== undefined)
                updateData.specialization = specialization.trim();
            if (isActive !== undefined)
                updateData.isActive = Boolean(isActive);
            const doctor = await doctor_model_1.Doctor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            if (!doctor) {
                res.status(404).json({ error: 'Doctor not found' });
                return;
            }
            console.log('👨‍⚕️ Updated doctor:', {
                id: doctor.id,
                name: doctor.name,
                changes: updateData
            });
            res.json(doctor);
        }
        catch (error) {
            console.error('Error updating doctor:', error);
            if (error instanceof Error && error.name === 'ValidationError') {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.message
                });
            }
            else if (error instanceof Error && error.name === 'CastError') {
                res.status(400).json({
                    error: 'Invalid doctor ID format'
                });
            }
            else if (error instanceof Error && error.code === 11000) {
                res.status(409).json({
                    error: 'Doctor with this name already exists'
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to update doctor',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * DELETE /api/doctors/:id - Soft delete doctor (set isActive to false)
     */
    static async deleteDoctor(req, res) {
        try {
            const { id } = req.params;
            const doctor = await doctor_model_1.Doctor.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!doctor) {
                res.status(404).json({ error: 'Doctor not found' });
                return;
            }
            console.log('👨‍⚕️ Deactivated doctor:', {
                id: doctor.id,
                name: doctor.name
            });
            res.json({ message: 'Doctor deactivated successfully' });
        }
        catch (error) {
            console.error('Error deactivating doctor:', error);
            if (error instanceof Error && error.name === 'CastError') {
                res.status(400).json({
                    error: 'Invalid doctor ID format'
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to deactivate doctor',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * GET /api/doctors/search - Search doctors by name
     */
    static async searchDoctors(req, res) {
        try {
            const q = req.query['q'];
            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    error: 'Search query parameter "q" is required'
                });
                return;
            }
            const doctors = await doctor_model_1.Doctor.find({
                isActive: true,
                name: new RegExp(q, 'i')
            })
                .sort({ name: 1 })
                .limit(20)
                .lean();
            res.json(doctors);
        }
        catch (error) {
            console.error('Error searching doctors:', error);
            res.status(500).json({
                error: 'Failed to search doctors',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.DoctorController = DoctorController;
//# sourceMappingURL=doctor.controller.js.map