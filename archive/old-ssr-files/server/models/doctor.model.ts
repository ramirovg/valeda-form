import { Schema, model, Document, Types } from 'mongoose';

// Interface for Doctor document
export interface IDoctor extends Document {
  _id: Types.ObjectId;
  name: string;
  specialization?: string;
  isActive: boolean;
  creationDate: Date;
}

// Doctor Schema
const DoctorSchema = new Schema<IDoctor>({
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
DoctorSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
DoctorSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

// Static method to get sample doctors
DoctorSchema.statics['getSampleDoctors'] = async function() {
  const sampleDoctors = [
    { name: 'Dr. García Hernández', specialization: 'Oftalmología' },
    { name: 'Dra. María Rodríguez', specialization: 'Oftalmología' },
    { name: 'Dr. Carlos Mendoza', specialization: 'Oftalmología' },
    { name: 'Dra. Ana Martínez', specialization: 'Oftalmología' }
  ];

  // Insert sample doctors if they don't exist
  for (const doctorData of sampleDoctors) {
    await this.findOneAndUpdate(
      { name: doctorData.name },
      doctorData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return this.find({ isActive: true }).sort({ name: 1 });
};

// Export the model
export const Doctor = model<IDoctor>('Doctor', DoctorSchema);
