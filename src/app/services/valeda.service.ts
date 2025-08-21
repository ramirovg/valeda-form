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
      if (filters.name && !treatment.patient.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      if (filters.doctor && !treatment.doctor.name.toLowerCase().includes(filters.doctor.toLowerCase())) {
        return false;
      }
      
      if (filters.dateFrom && treatment.creationDate < filters.dateFrom) {
        return false;
      }
      
      if (filters.dateTo && treatment.creationDate > filters.dateTo) {
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
      patientName: newTreatment.patient.name,
      sessionsCount: newTreatment.sessions.length,
      sessionsWithData: newTreatment.sessions.filter(s => s.technician || s.time || s.date).length,
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
      ? treatment.sessions.filter(s => s.technician || s.time || s.date).length 
      : 0;
    
    console.log('💾 Updating treatment with session data:', {
      treatmentId: id,
      patientName: treatment.patient?.name || this.treatments[index].patient.name,
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
      date: undefined,
      technician: '',
      time: ''
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
            treatment.creationDate = new Date(treatment.creationDate);
            treatment.patient.birthDate = new Date(treatment.patient.birthDate);
            treatment.sessions.forEach(session => {
              if (session.date) {
                session.date = new Date(session.date);
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
      { id: '1', name: 'Dr. García Hernández' },
      { id: '2', name: 'Dra. María Rodríguez' },
      { id: '3', name: 'Dr. Carlos Mendoza' },
      { id: '4', name: 'Dra. Ana Martínez' }
    ];
    return of(sampleDoctors);
  }
}