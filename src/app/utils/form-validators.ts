import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Collection of custom form validators for the Valeda application
 * Provides reusable validation logic with Spanish error messages
 */
export class ValedaValidators {
  
  /**
   * Validates that a patient name meets medical record requirements
   * - Must be at least 2 characters
   * - Cannot contain numbers or special characters except spaces, hyphens, and apostrophes
   */
  static patientName(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const value = control.value.toString().trim();
    
    if (value.length < 2) {
      return { 
        patientName: {
          message: 'El nombre debe tener al menos 2 caracteres',
          actualLength: value.length
        }
      };
    }

    // Allow letters, spaces, hyphens, apostrophes, and accented characters
    const namePattern = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'\-]+$/;
    if (!namePattern.test(value)) {
      return {
        patientName: {
          message: 'El nombre solo puede contener letras, espacios, guiones y apostrofes',
          invalidValue: value
        }
      };
    }

    return null;
  }

  /**
   * Validates doctor name format
   * Similar to patient name but allows "Dr." prefix
   */
  static doctorName(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString().trim();
    
    if (value.length < 2) {
      return { 
        doctorName: {
          message: 'El nombre del médico debe tener al menos 2 caracteres',
          actualLength: value.length
        }
      };
    }

    // Allow "Dr.", "Dra.", letters, spaces, hyphens, apostrophes, and periods
    const doctorPattern = /^(Dr\.?|Dra\.?\s)?[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'\-.]+$/;
    if (!doctorPattern.test(value)) {
      return {
        doctorName: {
          message: 'Formato de nombre de médico inválido',
          invalidValue: value
        }
      };
    }

    return null;
  }

  /**
   * Validates age range for medical treatments
   * - Must be between 1 and 150 years
   */
  static ageRange(control: AbstractControl): ValidationErrors | null {
    if (!control.value && control.value !== 0) {
      return null;
    }

    const age = parseInt(control.value, 10);
    
    if (isNaN(age)) {
      return {
        ageRange: {
          message: 'La edad debe ser un número válido',
          invalidValue: control.value
        }
      };
    }

    if (age < 1 || age > 150) {
      return {
        ageRange: {
          message: 'La edad debe estar entre 1 y 150 años',
          actualAge: age
        }
      };
    }

    return null;
  }

  /**
   * Validates birth date
   * - Cannot be in the future
   * - Must be within reasonable medical range (150 years ago to today)
   */
  static birthDate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const birthDate = new Date(control.value);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 150);

    if (isNaN(birthDate.getTime())) {
      return {
        birthDate: {
          message: 'Fecha de nacimiento inválida',
          invalidValue: control.value
        }
      };
    }

    if (birthDate > today) {
      return {
        birthDate: {
          message: 'La fecha de nacimiento no puede ser futura',
          futureDate: birthDate
        }
      };
    }

    if (birthDate < minDate) {
      return {
        birthDate: {
          message: 'La fecha de nacimiento es demasiado antigua',
          tooOldDate: birthDate
        }
      };
    }

    return null;
  }

  /**
   * Validates treatment session time format
   * - Must be in HH:MM format (24-hour)
   * - Hours: 00-23, Minutes: 00-59
   */
  static sessionTime(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const timeValue = control.value.toString().trim();
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timePattern.test(timeValue)) {
      return {
        sessionTime: {
          message: 'Formato de hora inválido (usar HH:MM)',
          invalidValue: timeValue
        }
      };
    }

    return null;
  }

  /**
   * Validates that a date is not in the future
   * Useful for treatment dates and session dates
   */
  static notFutureDate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const date = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow dates until end of today

    if (isNaN(date.getTime())) {
      return {
        notFutureDate: {
          message: 'Fecha inválida',
          invalidValue: control.value
        }
      };
    }

    if (date > today) {
      return {
        notFutureDate: {
          message: 'La fecha no puede ser futura',
          futureDate: date
        }
      };
    }

    return null;
  }

  /**
   * Creates a validator that checks minimum search length
   * @param minLength Minimum number of characters required
   */
  static minSearchLength(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString().trim();
      if (value.length < minLength) {
        return {
          minSearchLength: {
            message: `Mínimo ${minLength} caracteres para buscar`,
            actualLength: value.length,
            requiredLength: minLength
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates treatment type selection
   * Must be one of the valid treatment types
   */
  static treatmentType(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const validTypes = ['right-eye', 'left-eye', 'both-eyes'];
    if (!validTypes.includes(control.value)) {
      return {
        treatmentType: {
          message: 'Tipo de tratamiento inválido',
          invalidValue: control.value,
          validTypes: validTypes
        }
      };
    }

    return null;
  }
}

/**
 * Utility functions for extracting error messages from validation errors
 */
export class ValidationUtils {
  
  /**
   * Extracts the first error message from a control's errors
   * @param control The form control to check
   * @returns The first error message or null if no errors
   */
  static getFirstErrorMessage(control: AbstractControl): string | null {
    if (!control.errors) {
      return null;
    }

    const errorKeys = Object.keys(control.errors);
    if (errorKeys.length === 0) {
      return null;
    }

    const firstError = control.errors[errorKeys[0]];
    if (firstError && typeof firstError === 'object' && firstError.message) {
      return firstError.message;
    }

    // Fallback for standard Angular validators
    const standardMessages: Record<string, string> = {
      required: 'Este campo es obligatorio',
      email: 'Formato de email inválido',
      minlength: `Mínimo ${firstError?.requiredLength || 0} caracteres`,
      maxlength: `Máximo ${firstError?.requiredLength || 0} caracteres`,
      pattern: 'Formato inválido'
    };

    return standardMessages[errorKeys[0]] || 'Campo inválido';
  }

  /**
   * Gets all error messages from a control
   * @param control The form control to check
   * @returns Array of error messages
   */
  static getAllErrorMessages(control: AbstractControl): string[] {
    if (!control.errors) {
      return [];
    }

    return Object.keys(control.errors).map(key => {
      const error = control.errors![key];
      if (error && typeof error === 'object' && error.message) {
        return error.message;
      }
      return this.getFirstErrorMessage(control) || 'Error de validación';
    });
  }

  /**
   * Checks if a control has a specific error
   * @param control The form control to check
   * @param errorKey The error key to look for
   * @returns True if the control has the specified error
   */
  static hasError(control: AbstractControl, errorKey: string): boolean {
    return !!(control.errors && control.errors[errorKey]);
  }

  /**
   * Marks all controls in a form group as touched to trigger validation display
   * @param formGroup The form group to mark as touched
   */
  static markAllAsTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        if (control.controls) {
          this.markAllAsTouched(control);
        }
      }
    });
  }
}