import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ValedaValidators } from '../utils/form-validators';
import { ValedaTreatment } from '../models/valeda.models';

/**
 * Service for creating standardized forms across the Valeda application
 * Provides consistent form structure, validation, and default values
 */
@Injectable({
  providedIn: 'root'
})
export class ValedaFormBuilderService {
  private readonly fb = inject(FormBuilder);

  /**
   * Creates a complete treatment form with all necessary validations
   * @param treatment Optional existing treatment for editing
   * @returns FormGroup with patient, doctor, and treatment information
   */
  createTreatmentForm(treatment?: ValedaTreatment): FormGroup {
    return this.fb.group({
      patient: this.createPatientFormGroup(treatment?.patient),
      doctor: this.createDoctorFormGroup(treatment?.doctor),
      treatmentType: [
        treatment?.treatmentType || '',
        [Validators.required, ValedaValidators.treatmentType]
      ],
      sessions: this.createSessionsFormArray(treatment?.sessions || []),
      additionalIndications: [treatment?.additionalIndications || '']
    });
  }

  /**
   * Creates patient information form group
   * @param patient Optional existing patient data
   * @returns FormGroup for patient information
   */
  createPatientFormGroup(patient?: any): FormGroup {
    return this.fb.group({
      name: [
        patient?.name || '',
        [Validators.required, ValedaValidators.patientName]
      ],
      birthDate: [
        patient?.birthDate ? this.formatDateForInput(patient.birthDate) : '',
        [Validators.required, ValedaValidators.birthDate]
      ],
      age: [
        patient?.age || 0,
        [ValedaValidators.ageRange]
      ],
      gender: [patient?.gender || 'No especificado'],
      contactInfo: this.fb.group({
        phone: [patient?.contactInfo?.phone || ''],
        email: [patient?.contactInfo?.email || ''],
        address: [patient?.contactInfo?.address || '']
      })
    });
  }

  /**
   * Creates doctor information form group
   * @param doctor Optional existing doctor data
   * @returns FormGroup for doctor information
   */
  createDoctorFormGroup(doctor?: any): FormGroup {
    return this.fb.group({
      name: [
        doctor?.name || '',
        [Validators.required, ValedaValidators.doctorName]
      ],
      specialization: [doctor?.specialization || 'Oftalmología'],
      license: [doctor?.license || ''],
      contactInfo: this.fb.group({
        phone: [doctor?.contactInfo?.phone || ''],
        email: [doctor?.contactInfo?.email || '']
      })
    });
  }

  /**
   * Creates sessions form array for treatment sessions
   * @param sessions Optional existing sessions data
   * @returns FormArray with 9 session form groups
   */
  createSessionsFormArray(sessions: any[] = []): FormArray {
    const sessionControls = [];
    
    // Always create 9 sessions (standard Valeda treatment)
    for (let i = 0; i < 9; i++) {
      const existingSession = sessions[i];
      sessionControls.push(this.createSessionFormGroup(i + 1, existingSession));
    }

    return this.fb.array(sessionControls);
  }

  /**
   * Creates a single session form group
   * @param sessionNumber The session number (1-9)
   * @param session Optional existing session data
   * @returns FormGroup for session information
   */
  createSessionFormGroup(sessionNumber: number, session?: any): FormGroup {
    return this.fb.group({
      sessionNumber: [sessionNumber],
      date: [
        session?.date ? this.formatDateForInput(session.date) : '',
        [ValedaValidators.notFutureDate]
      ],
      time: [
        session?.time || '',
        [ValedaValidators.sessionTime]
      ],
      technician: [session?.technician || ''],
      eyeTreated: [session?.eyeTreated || ''],
      parameters: this.fb.group({
        power: [session?.parameters?.power || null],
        duration: [session?.parameters?.duration || null],
        wavelength: [session?.parameters?.wavelength || 670] // Default Valeda wavelength
      }),
      notes: [session?.notes || ''],
      completed: [session?.completed || false]
    });
  }

  /**
   * Creates search filters form group
   * @returns FormGroup for search functionality
   */
  createSearchForm(): FormGroup {
    return this.fb.group({
      name: ['', [ValedaValidators.minSearchLength(3)]],
      doctor: ['', [ValedaValidators.minSearchLength(3)]],
      treatmentType: [''],
      dateFrom: ['', [ValedaValidators.notFutureDate]],
      dateTo: ['', [ValedaValidators.notFutureDate]],
      sessionStatus: [''] // 'completed', 'in-progress', 'not-started'
    });
  }

  /**
   * Creates a quick patient registration form (simplified)
   * @returns FormGroup for quick patient registration
   */
  createQuickPatientForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, ValedaValidators.patientName]],
      birthDate: ['', [Validators.required, ValedaValidators.birthDate]],
      doctorName: ['', [Validators.required, ValedaValidators.doctorName]],
      treatmentType: ['', [Validators.required, ValedaValidators.treatmentType]]
    });
  }

  /**
   * Adds dynamic session validation based on previous sessions
   * @param sessionIndex The current session index
   * @param sessionsArray The sessions form array
   */
  addSessionSequenceValidation(sessionIndex: number, sessionsArray: FormArray): void {
    const currentSession = sessionsArray.at(sessionIndex);
    
    // Add validator to ensure sessions are completed in sequence
    currentSession.get('date')?.addValidators((control) => {
      if (!control.value) return null;

      const currentDate = new Date(control.value);
      
      // Check if previous session exists and is completed
      if (sessionIndex > 0) {
        const previousSession = sessionsArray.at(sessionIndex - 1);
        const previousDate = previousSession.get('date')?.value;
        
        if (!previousDate) {
          return {
            sessionSequence: {
              message: 'Complete la sesión anterior primero',
              previousSessionNumber: sessionIndex
            }
          };
        }

        // Ensure minimum gap between sessions (usually 1-2 days)
        const prevDate = new Date(previousDate);
        const daysDifference = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDifference < 1) {
          return {
            sessionSequence: {
              message: 'Debe haber al menos 1 día entre sesiones',
              daysDifference: daysDifference
            }
          };
        }
      }

      return null;
    });
  }

  /**
   * Utility method to format dates for HTML input fields
   * @param date Date object or date string
   * @returns String in YYYY-MM-DD format
   */
  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Validates the entire treatment form and returns validation summary
   * @param form The treatment form to validate
   * @returns Validation summary with errors and warnings
   */
  validateTreatmentForm(form: FormGroup): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check patient information
    const patientGroup = form.get('patient') as FormGroup;
    if (patientGroup?.invalid) {
      errors.push('Información del paciente incompleta');
    }

    // Check doctor information
    const doctorGroup = form.get('doctor') as FormGroup;
    if (doctorGroup?.invalid) {
      errors.push('Información del médico incompleta');
    }

    // Check treatment type
    if (!form.get('treatmentType')?.value) {
      errors.push('Seleccione el tipo de tratamiento');
    }

    // Check sessions for warnings
    const sessionsArray = form.get('sessions') as FormArray;
    const completedSessions = sessionsArray.controls.filter(
      session => session.get('date')?.value && session.get('completed')?.value
    ).length;

    if (completedSessions === 0) {
      warnings.push('No hay sesiones completadas registradas');
    } else if (completedSessions < 9) {
      warnings.push(`Tratamiento en progreso: ${completedSessions}/9 sesiones`);
    }

    return {
      isValid: form.valid && errors.length === 0,
      errors,
      warnings
    };
  }
}