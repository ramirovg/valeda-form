export interface Patient {
  id?: string;
  nombre: string;
  fechaNacimiento: Date;
  edad?: number;
}

export interface Doctor {
  id?: string;
  nombre: string;
}

export interface TreatmentSession {
  sessionNumber: number;
  fecha?: Date;
  tecnico?: string;
  hora?: string;
}

export interface ValedaTreatment {
  id?: string;
  patient: Patient;
  doctor: Doctor;
  fechaCreacion: Date;
  tipoTratamiento: 'ojo-derecho' | 'ojo-izquierdo' | 'ambos-ojos';
  sessions: TreatmentSession[];
  notasImportantes?: string;
  indicacionesAdicionales?: string;
}

export interface SearchFilters {
  nombre?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
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
  { value: 'ojo-derecho', label: 'Ojo Derecho' },
  { value: 'ojo-izquierdo', label: 'Ojo Izquierdo' },
  { value: 'ambos-ojos', label: 'Ambos Ojos' }
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