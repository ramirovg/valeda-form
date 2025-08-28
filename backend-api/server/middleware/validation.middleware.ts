import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

// Middleware to validate MongoDB ObjectId
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id) {
      res.status(400).json({
        error: `Missing required parameter: ${paramName}`
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId.`
      });
      return;
    }

    next();
  };
};

// Middleware to validate request body for treatment creation
export const validateTreatmentData = (req: Request, res: Response, next: NextFunction): void => {
  const { patient, doctor, treatmentType } = req.body;

  // Check required fields
  const errors: string[] = [];

  if (!patient) {
    errors.push('Patient information is required');
  } else {
    if (!patient.name || typeof patient.name !== 'string' || patient.name.trim().length === 0) {
      errors.push('Patient name is required and must be a non-empty string');
    }
    if (patient.age === undefined || typeof patient.age !== 'number' || patient.age < 0 || patient.age > 150) {
      errors.push('Patient age is required and must be a number between 0 and 150');
    }
    if (!patient.birthDate) {
      errors.push('Patient birth date is required');
    } else {
      const birthDate = new Date(patient.birthDate);
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        errors.push('Patient birth date must be a valid date not in the future');
      }
    }
  }

  if (!doctor) {
    errors.push('Doctor information is required');
  } else {
    if (!doctor.name || typeof doctor.name !== 'string' || doctor.name.trim().length === 0) {
      errors.push('Doctor name is required and must be a non-empty string');
    }
  }

  if (!treatmentType || typeof treatmentType !== 'string') {
    errors.push('Treatment type is required and must be a string');
  } else {
    const validTypes = ['right-eye', 'left-eye', 'both-eyes', 'ojo-derecho', 'ojo-izquierdo', 'ambos-ojos'];
    if (!validTypes.includes(treatmentType)) {
      errors.push(`Treatment type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate sessions if provided
  if (req.body.sessions && Array.isArray(req.body.sessions)) {
    req.body.sessions.forEach((session: any, index: number) => {
      if (typeof session.sessionNumber !== 'number' || session.sessionNumber < 1 || session.sessionNumber > 20) {
        errors.push(`Session ${index + 1}: sessionNumber must be a number between 1 and 20`);
      }

      if (session.date) {
        const sessionDate = new Date(session.date);
        if (isNaN(sessionDate.getTime())) {
          errors.push(`Session ${index + 1}: date must be a valid date if provided`);
        }
      }

      if (session.time && typeof session.time === 'string' && session.time.length > 0) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(session.time)) {
          errors.push(`Session ${index + 1}: time must be in HH:MM format if provided`);
        }
      }
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
    return;
  }

  next();
};

// Middleware to validate doctor data
export const validateDoctorData = (req: Request, res: Response, next: NextFunction): void => {
  const { name, specialization } = req.body;

  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Doctor name is required and must be a non-empty string');
  } else if (name.length > 200) {
    errors.push('Doctor name cannot exceed 200 characters');
  }

  if (specialization !== undefined) {
    if (typeof specialization !== 'string') {
      errors.push('Specialization must be a string if provided');
    } else if (specialization.length > 100) {
      errors.push('Specialization cannot exceed 100 characters');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
    return;
  }

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid data format',
      details: err.message
    });
    return;
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this information already exists'
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong'
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;

  console.log(`📥 ${method} ${url} - ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';

    console.log(`📤 ${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`);
  });

  next();
};
