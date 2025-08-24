import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, map } from 'rxjs';
import { ValedaTreatment, Patient, Doctor, TreatmentSession, SearchFilters } from '../models/valeda.models';

@Injectable({
  providedIn: 'root'
})
export class ValedaService {
  private readonly apiUrl = this.getApiUrl();
  private treatmentsSubject = new BehaviorSubject<ValedaTreatment[]>([]);

  constructor(private http: HttpClient) {
    // Load treatments from server on initialization
    this.loadTreatments();
  }

  /**
   * Get API URL based on environment
   */
  private getApiUrl(): string {
    // Check if we're in development and have a separate API server
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' && 
                   (window.location.port === '4200' || window.location.port === '4201');
      return isDev ? 'http://localhost:3001/api' : '/api';
    }
    return '/api';
  }

  /**
   * Get all treatments as observable
   */
  getTreatments(): Observable<ValedaTreatment[]> {
    return this.http.get<{data: ValedaTreatment[], pagination: any}>(`${this.apiUrl}/treatments`).pipe(
      map(response => response.data), // Extract the data array from paginated response
      tap(treatments => {
        // Convert date strings to Date objects
        const processedTreatments = treatments.map(treatment => this.processTreatmentDates(treatment));
        this.treatmentsSubject.next(processedTreatments);
      }),
      catchError(error => {
        console.error('Error loading treatments:', error);
        // Fall back to localStorage in case server is unavailable
        return this.loadTreatmentsFromLocalStorage();
      })
    );
  }

  /**
   * Search treatments by filters
   */
  searchTreatments(filters: SearchFilters): Observable<ValedaTreatment[]> {
    let params = new HttpParams();
    
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.doctor) {
      params = params.set('doctor', filters.doctor);
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo.toISOString());
    }

    return this.http.get<{data: ValedaTreatment[], pagination: any}>(`${this.apiUrl}/treatments`, { params }).pipe(
      map(response => response.data), // Extract the data array from paginated response
      tap(treatments => {
        const processedTreatments = treatments.map(treatment => this.processTreatmentDates(treatment));
        this.treatmentsSubject.next(processedTreatments);
      }),
      catchError(error => {
        console.error('Error searching treatments:', error);
        return of([]);
      })
    );
  }

  /**
   * Get treatment by ID
   */
  getTreatmentById(id: string): Observable<ValedaTreatment | null> {
    return this.http.get<ValedaTreatment>(`${this.apiUrl}/treatments/${id}`).pipe(
      tap(treatment => {
        // Process dates
        this.processTreatmentDates(treatment);
      }),
      catchError(error => {
        console.error('Error getting treatment by ID:', error);
        return of(null);
      })
    );
  }

  /**
   * Create new treatment
   */
  createTreatment(treatment: Omit<ValedaTreatment, 'id'>): Observable<ValedaTreatment> {
    console.log('🏥 Creating new treatment:', {
      patientName: treatment.patient.name,
      doctorName: treatment.doctor.name,
      sessionsCount: treatment.sessions?.length || 0,
      sessionsWithData: treatment.sessions?.filter(s => s.technician || s.time || s.date).length || 0
    });

    return this.http.post<ValedaTreatment>(`${this.apiUrl}/treatments`, treatment).pipe(
      tap(newTreatment => {
        // Process dates
        this.processTreatmentDates(newTreatment);
        
        // Update local state
        this.refreshTreatments();
      }),
      catchError(error => {
        console.error('Error creating treatment:', error);
        // Fall back to localStorage
        return this.createTreatmentLocalStorage(treatment);
      })
    );
  }

  /**
   * Update existing treatment
   */
  updateTreatment(id: string, treatment: Partial<ValedaTreatment>): Observable<ValedaTreatment | null> {
    const sessionsWithData = treatment.sessions 
      ? treatment.sessions.filter(s => s.technician || s.time || s.date).length 
      : 0;
    
    console.log('💾 Updating treatment:', {
      treatmentId: id,
      patientName: treatment.patient?.name,
      sessionsWithData: sessionsWithData
    });

    return this.http.put<ValedaTreatment>(`${this.apiUrl}/treatments/${id}`, treatment).pipe(
      tap(updatedTreatment => {
        // Process dates
        this.processTreatmentDates(updatedTreatment);
        
        // Update local state
        this.refreshTreatments();
      }),
      catchError(error => {
        console.error('Error updating treatment:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete treatment
   */
  deleteTreatment(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/treatments/${id}`).pipe(
      tap(() => {
        console.log('🗑️ Deleted treatment:', id);
        // Update local state
        this.refreshTreatments();
      }),
      map(() => true), // Map successful deletion to true
      catchError(error => {
        console.error('Error deleting treatment:', error);
        return of(false);
      })
    );
  }

  /**
   * Get sample doctors for autocomplete
   */
  getSampleDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/sample`).pipe(
      catchError(error => {
        console.error('Error loading doctors from server:', error);
        // Fallback to default doctors
        const sampleDoctors: Doctor[] = [
          { id: '1', name: 'Dr. García Hernández' },
          { id: '2', name: 'Dra. María Rodríguez' },
          { id: '3', name: 'Dr. Carlos Mendoza' },
          { id: '4', name: 'Dra. Ana Martínez' }
        ];
        return of(sampleDoctors);
      })
    );
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
   * Process treatment dates - convert strings to Date objects
   */
  private processTreatmentDates(treatment: any): ValedaTreatment {
    return {
      ...treatment,
      creationDate: treatment.creationDate ? new Date(treatment.creationDate) : new Date(),
      patient: {
        ...treatment.patient,
        birthDate: treatment.patient?.birthDate ? new Date(treatment.patient.birthDate) : undefined
      },
      sessions: Array.isArray(treatment.sessions) ? treatment.sessions.map((session: any) => ({
        ...session,
        date: session.date ? new Date(session.date) : undefined
      })) : []
    };
  }

  /**
   * Refresh treatments from server
   */
  private refreshTreatments(): void {
    this.getTreatments().subscribe();
  }

  /**
   * Load treatments from server on initialization
   */
  private loadTreatments(): void {
    this.getTreatments().subscribe({
      next: () => console.log('✅ Treatments loaded from server'),
      error: (error) => console.error('❌ Failed to load treatments from server:', error)
    });
  }

  // Fallback methods for localStorage support

  /**
   * Fallback: Load treatments from localStorage
   */
  private loadTreatmentsFromLocalStorage(): Observable<ValedaTreatment[]> {
    console.log('📱 Falling back to localStorage');
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('valeda-treatments');
        if (stored) {
          const treatments = JSON.parse(stored);
          // Convert date strings back to Date objects
          const processedTreatments = treatments.map((treatment: any) => this.processTreatmentDates(treatment));
          this.treatmentsSubject.next(processedTreatments);
          return of(processedTreatments);
        }
      } catch (error) {
        console.error('Error loading treatments from localStorage:', error);
      }
    }
    return of([]);
  }

  /**
   * Fallback: Create treatment in localStorage
   */
  private createTreatmentLocalStorage(treatment: Omit<ValedaTreatment, 'id'>): Observable<ValedaTreatment> {
    const newTreatment: ValedaTreatment = {
      ...treatment,
      id: this.generateId(),
      sessions: treatment.sessions && treatment.sessions.length > 0 
        ? treatment.sessions 
        : this.initializeSessions(),
      creationDate: new Date()
    };
    
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('valeda-treatments');
        const treatments = stored ? JSON.parse(stored) : [];
        treatments.push(newTreatment);
        localStorage.setItem('valeda-treatments', JSON.stringify(treatments));
        this.treatmentsSubject.next(treatments);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
    
    return of(newTreatment);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}