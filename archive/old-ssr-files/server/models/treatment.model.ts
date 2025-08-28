import { Schema, model, Document, Types } from 'mongoose';

// Interface for Patient subdocument
export interface IPatient {
  name: string;
  age: number;
  birthDate: Date;
}

// Interface for Doctor subdocument
export interface IDoctor {
  name: string;
}

// Interface for Treatment Session subdocument
export interface ITreatmentSession {
  sessionNumber: number;
  date?: Date;
  technician: string;
  time: string;
}

// Interface for Treatment document
export interface ITreatment extends Document {
  _id: Types.ObjectId;
  patient: IPatient;
  doctor: IDoctor;
  treatmentType: string;
  sessions: ITreatmentSession[];
  additionalIndications?: string;
  creationDate: Date;
  lastModified: Date;
}

// Patient Schema
const PatientSchema = new Schema<IPatient>({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [200, 'Patient name cannot exceed 200 characters']
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  birthDate: {
    type: Date,
    required: [true, 'Birth date is required'],
    validate: {
      validator: function(date: Date) {
        return date <= new Date();
      },
      message: 'Birth date cannot be in the future'
    }
  }
}, { _id: false });

// Doctor Schema
const DoctorSchema = new Schema<IDoctor>({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [200, 'Doctor name cannot exceed 200 characters']
  }
}, { _id: false });

// Treatment Session Schema
const TreatmentSessionSchema = new Schema<ITreatmentSession>({
  sessionNumber: {
    type: Number,
    required: [true, 'Session number is required'],
    min: [1, 'Session number must be at least 1'],
    max: [20, 'Session number cannot exceed 20']
  },
  date: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        if (!date) return true; // Optional field
        return date >= new Date('2020-01-01');
      },
      message: 'Session date must be after 2020'
    }
  },
  technician: {
    type: String,
    trim: true,
    maxlength: [100, 'Technician name cannot exceed 100 characters'],
    default: ''
  },
  time: {
    type: String,
    trim: true,
    validate: {
      validator: function(time: string) {
        if (!time) return true; // Optional field
        // Validate HH:MM format
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Time must be in HH:MM format'
    },
    default: ''
  }
}, { _id: false });

// Main Treatment Schema
const TreatmentSchema = new Schema<ITreatment>({
  patient: {
    type: PatientSchema,
    required: [true, 'Patient information is required']
  },
  doctor: {
    type: DoctorSchema,
    required: [true, 'Doctor information is required']
  },
  treatmentType: {
    type: String,
    required: [true, 'Treatment type is required'],
    enum: {
      values: ['right-eye', 'left-eye', 'both-eyes', 'ojo-derecho', 'ojo-izquierdo', 'ambos-ojos'],
      message: 'Invalid treatment type'
    },
    trim: true
  },
  sessions: {
    type: [TreatmentSessionSchema],
    validate: {
      validator: function(sessions: ITreatmentSession[]) {
        return sessions.length <= 20;
      },
      message: 'Cannot have more than 20 sessions'
    },
    default: function() {
      // Initialize with 9 empty sessions
      return Array.from({ length: 9 }, (_, index) => ({
        sessionNumber: index + 1,
        technician: '',
        time: ''
      }));
    }
  },
  additionalIndications: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional indications cannot exceed 1000 characters'],
    default: ''
  },
  creationDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'creationDate', updatedAt: 'lastModified' }
});

// Indexes for better query performance
TreatmentSchema.index({ 'patient.name': 'text', 'doctor.name': 'text' });
TreatmentSchema.index({ creationDate: -1 });
TreatmentSchema.index({ lastModified: -1 });
TreatmentSchema.index({ treatmentType: 1 });

// Pre-save middleware to update lastModified
TreatmentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Virtual for treatment ID as string
TreatmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
TreatmentSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

// Export the model
export const Treatment = model<ITreatment>('Treatment', TreatmentSchema);
