export interface Patient {
  id?: string;
  name: string;
  birthDate: Date;
  age?: number;
}

export interface Doctor {
  id?: string;
  name: string;
}

export interface TreatmentSession {
  sessionNumber: number;
  date?: Date;
  technician?: string;
  time?: string;
}

export interface ValedaTreatment {
  id?: string;
  patient: Patient;
  doctor: Doctor;
  creationDate: Date;
  treatmentType: 'right-eye' | 'left-eye' | 'both-eyes';
  sessions: TreatmentSession[];
  importantNotes?: string;
  additionalIndications?: string;
}

export interface SearchFilters {
  name?: string;
  dateFrom?: Date;
  dateTo?: Date;
  doctor?: string;
}

// Phone lines for the clinic
export const CLINIC_PHONE_LINES = [
  '818318-6858',
  '818318-6816', 
  '818318-6852',
  '818318-6853',
  '814444-2090'
];

// Treatment eye options
export const TREATMENT_EYE_OPTIONS = [
  { value: 'right-eye', label: 'Ojo Derecho' },
  { value: 'left-eye', label: 'Ojo Izquierdo' },
  { value: 'both-eyes', label: 'Ambos Ojos' }
] as const;

// Available technicians
export const TECHNICIANS_LIST = [
  'Mayra Ruiz',
  'Mario Rodriguez',
  'Elizabeth Perez',
  'Monica Tovar',
  'Eneyda Valdez',
  'Felipe Ponce',
  'Cristina Ruiz'
] as const;