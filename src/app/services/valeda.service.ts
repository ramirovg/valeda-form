import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ValedaTreatment, Patient, Doctor, TreatmentSession, SearchFilters } from '../models/valeda.models';

@Injectable({
  providedIn: 'root'
})
export class ValedaService {
  private treatments: ValedaTreatment[] = [];
  private treatmentsSubject = new BehaviorSubject<ValedaTreatment[]>([]);

  constructor() {
    // Load from localStorage on initialization
    this.loadTreatments();
  }

  /**
   * Get all treatments as observable
   */
  getTreatments(): Observable<ValedaTreatment[]> {
    return this.treatmentsSubject.asObservable();
  }

  /**
   * Search treatments by filters
   */
  searchTreatments(filters: SearchFilters): Observable<ValedaTreatment[]> {
    const filtered = this.treatments.filter(treatment => {
      if (filters.nombre && !treatment.patient.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
        return false;
      }
      
      if (filters.doctor && !treatment.doctor.nombre.toLowerCase().includes(filters.doctor.toLowerCase())) {
        return false;
      }
      
      if (filters.fechaDesde && treatment.fechaCreacion < filters.fechaDesde) {
        return false;
      }
      
      if (filters.fechaHasta && treatment.fechaCreacion > filters.fechaHasta) {
        return false;
      }
      
      return true;
    });
    
    return of(filtered);
  }

  /**
   * Get treatment by ID
   */
  getTreatmentById(id: string): Observable<ValedaTreatment | null> {
    const treatment = this.treatments.find(t => t.id === id);
    return of(treatment || null);
  }

  /**
   * Create new treatment
   */
  createTreatment(treatment: Omit<ValedaTreatment, 'id'>): Observable<ValedaTreatment> {
    const newTreatment: ValedaTreatment = {
      ...treatment,
      id: this.generateId(),
      // Preserve session data from form, or initialize empty sessions if none provided
      sessions: treatment.sessions && treatment.sessions.length > 0 
        ? treatment.sessions 
        : this.initializeSessions()
    };
    
    console.log('🏥 Creating new treatment with session data:', {
      treatmentId: newTreatment.id,
      patientName: newTreatment.patient.nombre,
      sessionsCount: newTreatment.sessions.length,
      sessionsWithData: newTreatment.sessions.filter(s => s.tecnico || s.hora || s.fecha).length,
      sessionData: newTreatment.sessions
    });
    
    this.treatments.push(newTreatment);
    this.saveTreatments();
    this.treatmentsSubject.next([...this.treatments]);
    
    return of(newTreatment);
  }

  /**
   * Update existing treatment
   */
  updateTreatment(id: string, treatment: Partial<ValedaTreatment>): Observable<ValedaTreatment | null> {
    const index = this.treatments.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.log('❌ Treatment not found for update:', id);
      return of(null);
    }
    
    const sessionsWithData = treatment.sessions 
      ? treatment.sessions.filter(s => s.tecnico || s.hora || s.fecha).length 
      : 0;
    
    console.log('💾 Updating treatment with session data:', {
      treatmentId: id,
      patientName: treatment.patient?.nombre || this.treatments[index].patient.nombre,
      sessionsWithData: sessionsWithData,
      sessionData: treatment.sessions
    });
    
    this.treatments[index] = { ...this.treatments[index], ...treatment };
    this.saveTreatments();
    this.treatmentsSubject.next([...this.treatments]);
    
    return of(this.treatments[index]);
  }

  /**
   * Delete treatment
   */
  deleteTreatment(id: string): Observable<boolean> {
    const index = this.treatments.findIndex(t => t.id === id);
    
    if (index === -1) {
      return of(false);
    }
    
    this.treatments.splice(index, 1);
    this.saveTreatments();
    this.treatmentsSubject.next([...this.treatments]);
    
    return of(true);
  }

  /**
   * Initialize empty sessions for new treatment
   */
  private initializeSessions(): TreatmentSession[] {
    return Array.from({ length: 9 }, (_, index) => ({
      sessionNumber: index + 1,
      fecha: undefined,
      tecnico: '',
      hora: ''
    }));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Save treatments to localStorage
   */
  private saveTreatments(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('valeda-treatments', JSON.stringify(this.treatments));
      } catch (error) {
        console.error('Error saving treatments to localStorage:', error);
      }
    }
  }

  /**
   * Load treatments from localStorage
   */
  private loadTreatments(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('valeda-treatments');
        if (stored) {
          this.treatments = JSON.parse(stored);
          // Convert date strings back to Date objects
          this.treatments.forEach(treatment => {
            treatment.fechaCreacion = new Date(treatment.fechaCreacion);
            treatment.patient.fechaNacimiento = new Date(treatment.patient.fechaNacimiento);
            treatment.sessions.forEach(session => {
              if (session.fecha) {
                session.fecha = new Date(session.fecha);
              }
            });
          });
          this.treatmentsSubject.next([...this.treatments]);
        }
      } catch (error) {
        console.error('Error loading treatments from localStorage:', error);
        this.treatments = [];
      }
    }
  }

  /**
   * Get sample doctors for autocomplete
   */
  getSampleDoctors(): Observable<Doctor[]> {
    const sampleDoctors: Doctor[] = [
      { id: '1', nombre: 'Dr. García Hernández' },
      { id: '2', nombre: 'Dra. María Rodríguez' },
      { id: '3', nombre: 'Dr. Carlos Mendoza' },
      { id: '4', nombre: 'Dra. Ana Martínez' }
    ];
    return of(sampleDoctors);
  }
}