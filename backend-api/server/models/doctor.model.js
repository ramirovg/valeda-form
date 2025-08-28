"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctor = void 0;
const mongoose_1 = require("mongoose");
// Doctor Schema
const DoctorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        unique: true,
        maxlength: [200, 'Doctor name cannot exceed 200 characters'],
        index: true
    },
    specialization: {
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters'],
        default: 'Oftalmología'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    creationDate: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: { createdAt: 'creationDate' }
});
// Text index for searching
DoctorSchema.index({ name: 'text', specialization: 'text' });
// Virtual for doctor ID as string
DoctorSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
// Ensure virtual fields are serialized
DoctorSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});
// Static method to get sample doctors
DoctorSchema.statics['getSampleDoctors'] = async function () {
    const sampleDoctors = [
        { name: 'Dr. García Hernández', specialization: 'Oftalmología' },
        { name: 'Dra. María Rodríguez', specialization: 'Oftalmología' },
        { name: 'Dr. Carlos Mendoza', specialization: 'Oftalmología' },
        { name: 'Dra. Ana Martínez', specialization: 'Oftalmología' }
    ];
    // Insert sample doctors if they don't exist
    for (const doctorData of sampleDoctors) {
        await this.findOneAndUpdate({ name: doctorData.name }, doctorData, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    return this.find({ isActive: true }).sort({ name: 1 });
};
// Export the model
exports.Doctor = (0, mongoose_1.model)('Doctor', DoctorSchema);
//# sourceMappingURL=doctor.model.js.map