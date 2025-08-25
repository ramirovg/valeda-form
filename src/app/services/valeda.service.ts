import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { ValedaTreatment, Doctor, TreatmentSession, SearchFilters } from '../models/valeda.models';

@Injectable({
  providedIn: 'root'
})
export class ValedaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly apiUrl = this.getApiUrl();

  // Modern Angular Signals-based state management
  private readonly _treatments = signal<ValedaTreatment[]>([]);

  // Public readonly access to treatments
  public readonly treatments = this._treatments.asReadonly();

  // Computed values for derived state
  public readonly treatmentCount = computed(() => this.treatments().length);
  public readonly hasLoadedTreatments = computed(() => this.treatments().length > 0);

  constructor(private http: HttpClient) {
    console.log(`[ValedaService] constructor, isBrowser: ${this.isBrowser}`);
    // Load treatments from server on initialization
    if (this.isBrowser) {
      this.loadTreatments();
    }
  }

  /**
   * Get API URL based on environment
   */
  private getApiUrl(): string {
    if (this.isBrowser) {
      const isDev = window.location.hostname === 'localhost' &&
                   (window.location.port === '4200' || window.location.port === '4201');
      
      if (isDev) {
        return 'http://localhost:3001/api';
      }
      
      // Production: check if we're in /valeda/ subfolder
      const isValedaPath = window.location.pathname.startsWith('/valeda');
      return isValedaPath ? '/valeda/api' : '/api';
    }
    
    // For SSR, use development API URL
    return 'http://localhost:3001/api';
  }

  /**
   * Get all treatments as observable - Updates internal signal state
   */
  getTreatments(): Observable<ValedaTreatment[]> {
    console.log('[ValedaService] getTreatments');
    return this.http.get<{data: ValedaTreatment[], pagination: any}>(`${this.apiUrl}/treatments`).pipe(
      map(response => response.data), // Extract the data array from paginated response
      tap(treatments => {
        console.log('[ValedaService] getTreatments success, processing treatments');
        // Convert date strings to Date objects and update signal
        const processedTreatments = treatments.map(treatment => this.processTreatmentDates(treatment));
        this._treatments.set(processedTreatments);
      }),
      catchError(error => {
        console.error('Error loading treatments:', error);
        // Fall back to localStorage in case server is unavailable
        return this.loadTreatmentsFromLocalStorage();
      })
    );
  }

  /**
   * Search treatments by filters (Backend filtering - scalable for large datasets)
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
        this._treatments.set(processedTreatments);
      }),
      catchError(error => {
        console.error('Error searching treatments:', error);
        return of([]);
      })
    );
  }

  /**
   * Search treatments by filters (Frontend filtering - instant results for small datasets)
   * Uses signals for reactive filtering
   */
  searchTreatmentsFrontend(filters: SearchFilters): Observable<ValedaTreatment[]> {
    // Convert signal to observable for compatibility
    const allTreatments = this.treatments();
    
    if (!filters || (!filters.name && !filters.doctor && !filters.dateFrom && !filters.dateTo)) {
      return of(allTreatments);
    }

    const filteredResults = allTreatments.filter(treatment => {
          // Name filtering (case-insensitive partial match)
          if (filters.name) {
            const searchName = filters.name.toLowerCase().trim();
            const patientName = treatment.patient.name.toLowerCase();
            if (!patientName.includes(searchName)) {
              return false;
            }
          }
          
          // Doctor filtering (case-insensitive partial match)
          if (filters.doctor) {
            const searchDoctor = filters.doctor.toLowerCase().trim();
            const doctorName = treatment.doctor.name.toLowerCase();
            if (!doctorName.includes(searchDoctor)) {
              return false;
            }
          }
          
          // Date range filtering
          if (filters.dateFrom) {
            const treatmentDate = new Date(treatment.creationDate);
            if (treatmentDate < filters.dateFrom) {
              return false;
            }
          }
          
          if (filters.dateTo) {
            const treatmentDate = new Date(treatment.creationDate);
            // Set end of day for dateTo comparison
            const endOfDay = new Date(filters.dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            if (treatmentDate > endOfDay) {
              return false;
            }
          }
          
          return true;
        });
        
    return of(filteredResults);
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
        console.error('Error updating treatment via API:', error);
        console.log('📱 Falling back to localStorage update');
        // Fall back to localStorage
        return this.updateTreatmentLocalStorage(id, treatment);
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
   * Get unique patient names for autocomplete
   */
  getPatientNames(): Observable<string[]> {
    return this.getTreatments().pipe(
      map(treatments => {
        const names = treatments.map(t => t.patient.name);
        return [...new Set(names)].sort(); // Remove duplicates and sort
      })
    );
  }

  /**
   * Get doctor names for autocomplete
   */
  getDoctorNames(): Observable<string[]> {
    return this.getSampleDoctors().pipe(
      map(doctors => doctors.map(d => d.name).sort())
    );
  }

  /**
   * Initialize empty sessions for new treatment
   */
  private initializeSessions(): TreatmentSession[] {
    return Array.from({ length: 9 }, (_, index) => ({
      sessionNumber: index + 1,
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
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem('valeda-treatments');
        if (stored) {
          console.log('[ValedaService] Found treatments in localStorage');
          const treatments = JSON.parse(stored);
          // Convert date strings back to Date objects
          const processedTreatments = treatments.map((treatment: any) => this.processTreatmentDates(treatment));
          this._treatments.set(processedTreatments);
          return of(processedTreatments);
        } else {
          console.log('[ValedaService] No treatments in localStorage, creating sample data');
          const sampleTreatments = this.createSampleTreatments();
          this._treatments.set(sampleTreatments);
          localStorage.setItem('valeda-treatments', JSON.stringify(sampleTreatments));
          return of(sampleTreatments);
        }
      } catch (error) {
        console.error('Error loading treatments from localStorage:', error);
      }
    }
    return of([]);
  }

  /**
   * Fallback: Update treatment in localStorage
   */
  private updateTreatmentLocalStorage(id: string, treatmentUpdate: Partial<ValedaTreatment>): Observable<ValedaTreatment | null> {
    console.log('📱 Updating treatment in localStorage:', id);
    if (!this.isBrowser) {
      return of(null);
    }

    try {
      const stored = localStorage.getItem('valeda-treatments');
      if (!stored) {
        console.error('No treatments found in localStorage');
        return of(null);
      }

      const treatments = JSON.parse(stored);
      const treatmentIndex = treatments.findIndex((t: any) => (t.id || t._id) === id);
      
      if (treatmentIndex === -1) {
        console.error('Treatment not found in localStorage:', id);
        return of(null);
      }

      // Update the treatment with new data
      const existingTreatment = treatments[treatmentIndex];
      const updatedTreatment = {
        ...existingTreatment,
        ...treatmentUpdate,
        id: existingTreatment.id || existingTreatment._id,
        // Preserve creation date from existing treatment
        creationDate: existingTreatment.creationDate || new Date()
      };

      // Process dates to ensure they're properly formatted
      const processedTreatment = this.processTreatmentDates(updatedTreatment);
      treatments[treatmentIndex] = processedTreatment;

      // Save back to localStorage
      localStorage.setItem('valeda-treatments', JSON.stringify(treatments));
      
      // Update the internal signal
      this._treatments.set(treatments.map((t: any) => this.processTreatmentDates(t)));

      console.log('✅ Treatment updated successfully in localStorage');
      return of(processedTreatment);
      
    } catch (error) {
      console.error('Error updating treatment in localStorage:', error);
      return of(null);
    }
  }

  /**
   * Fallback: Create treatment in localStorage
   */
  private createTreatmentLocalStorage(treatment: Omit<ValedaTreatment, 'id'>): Observable<ValedaTreatment> {
    console.log('📱 Creating treatment in localStorage');
    const newTreatment: ValedaTreatment = {
      ...treatment,
      id: this.generateId(),
      sessions: treatment.sessions && treatment.sessions.length > 0 
        ? treatment.sessions 
        : this.initializeSessions(),
      creationDate: new Date()
    };
    
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem('valeda-treatments');
        const treatments = stored ? JSON.parse(stored) : [];
        treatments.push(newTreatment);
        localStorage.setItem('valeda-treatments', JSON.stringify(treatments));
        this._treatments.set(treatments);
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

  /**
   * Create sample treatments for testing
   */
  private createSampleTreatments(): ValedaTreatment[] {
    const sampleTreatments: ValedaTreatment[] = [
      {
        id: this.generateId(),
        patient: {
          name: 'María González Hernández',
          birthDate: new Date('1980-05-15'),
          age: 44
        },
        doctor: {
          name: 'Dr. García Hernández'
        },
        creationDate: new Date('2024-01-15'),
        treatmentType: 'both-eyes',
        sessions: this.initializeSessions(),
        additionalIndications: 'Revisión cada 3 días. Mantener regularidad en horarios.'
      },
      {
        id: this.generateId(),
        patient: {
          name: 'Juan Carlos Ramírez',
          birthDate: new Date('1965-11-20'),
          age: 59
        },
        doctor: {
          name: 'Dra. María Rodríguez'
        },
        creationDate: new Date('2024-02-03'),
        treatmentType: 'right-eye',
        sessions: this.initializeSessions(),
        additionalIndications: 'Paciente con hipertensión controlada. Monitorear presión ocular.'
      },
      {
        id: this.generateId(),
        patient: {
          name: 'Ana Lucía Mendoza',
          birthDate: new Date('1975-08-10'),
          age: 49
        },
        doctor: {
          name: 'Dr. Carlos Mendoza'
        },
        creationDate: new Date('2024-02-20'),
        treatmentType: 'left-eye',
        sessions: this.initializeSessions(),
        additionalIndications: 'Primera experiencia con fotobiomodulación. Explicar procedimiento en cada sesión.'
      }
    ];

    // Add some completed sessions to the first treatment for demonstration
    sampleTreatments[0].sessions[0] = {
      sessionNumber: 1,
      date: new Date('2024-01-16'),
      technician: 'Mayra Ruiz',
      time: '10:30'
    };
    sampleTreatments[0].sessions[1] = {
      sessionNumber: 2,
      date: new Date('2024-01-19'),
      technician: 'Mario Rodriguez',
      time: '14:15'
    };

    return sampleTreatments;
  }
}