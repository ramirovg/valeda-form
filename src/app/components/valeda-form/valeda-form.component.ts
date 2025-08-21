import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValedaTreatment, Patient, Doctor, TREATMENT_EYE_OPTIONS, CLINIC_PHONE_LINES } from '../../models/valeda.models';
import { DateUtilsService } from '../../services/date-utils.service';
import { ValedaService } from '../../services/valeda.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-valeda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Header with Logo and Date -->
      <div class="flex justify-between items-start mb-6">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mr-4">
            <span class="text-white font-bold text-lg">OL</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">OFTALMO LASER</h1>
            <p class="text-sm text-gray-600">De Monterrey</p>
          </div>
        </div>
        
        <div class="bg-green-600 text-white px-4 py-2 rounded">
          <div class="text-center">
            <div class="text-sm font-medium">FECHA</div>
            <div class="text-lg">{{ currentDate }}</div>
          </div>
        </div>
      </div>

      <!-- Form Title -->
      <h2 class="text-center text-xl font-bold text-blue-600 mb-6">
        TRATAMIENTO DE FOTOBIOMODULACIÓN CON VALEDA
      </h2>

      <form [formGroup]="treatmentForm" (ngSubmit)="onSubmit()">
        <!-- Patient Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Paciente *
            </label>
            <input
              type="text"
              formControlName="patientName"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el nombre completo del paciente"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              formControlName="birthDate"
              (change)="onBirthDateChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Edad
            </label>
            <input
              type="number"
              [value]="calculatedAge"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              placeholder="Se calcula automáticamente"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Médico *
            </label>
            <input
              type="text"
              formControlName="doctorName"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el nombre del médico"
            />
          </div>
        </div>

        <!-- Treatment Type -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Tx Valeda *
          </label>
          <div class="flex flex-wrap gap-4">
            <div *ngFor="let option of treatmentOptions" class="flex items-center">
              <input
                type="radio"
                [id]="option.value"
                [value]="option.value"
                formControlName="treatmentType"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <label [for]="option.value" class="ml-2 text-sm font-medium text-gray-700">
                {{ option.label }}
              </label>
            </div>
          </div>
        </div>

        <!-- Treatment Sessions -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4 text-center">
            FECHAS DE SESIONES DEL TRATAMIENTO
          </h3>
          
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">Sesión</th>
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">D</th>
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">M</th>
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">A</th>
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">Técnico</th>
                  <th class="border border-gray-300 px-3 py-2 text-left font-medium">Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let session of sessions; let i = index">
                  <td class="border border-gray-300 px-3 py-2 font-medium">
                    Sesión {{ session.sessionNumber }}
                  </td>
                  <td class="border border-gray-300 px-1 py-2">
                    <input
                      type="number"
                      [(ngModel)]="session.day"
                      [ngModelOptions]="{standalone: true}"
                      (change)="updateSessionDate(i)"
                      min="1"
                      max="31"
                      class="w-12 px-1 py-1 border border-gray-200 rounded text-center text-sm"
                      placeholder="DD"
                    />
                  </td>
                  <td class="border border-gray-300 px-1 py-2">
                    <select
                      [(ngModel)]="session.month"
                      [ngModelOptions]="{standalone: true}"
                      (change)="updateSessionDate(i)"
                      class="w-16 px-1 py-1 border border-gray-200 rounded text-xs"
                    >
                      <option value="">M</option>
                      <option *ngFor="let month of spanishMonths; let mi = index" [value]="mi">
                        {{ month }}
                      </option>
                    </select>
                  </td>
                  <td class="border border-gray-300 px-1 py-2">
                    <input
                      type="number"
                      [(ngModel)]="session.year"
                      [ngModelOptions]="{standalone: true}"
                      (change)="updateSessionDate(i)"
                      min="2024"
                      max="2030"
                      class="w-16 px-1 py-1 border border-gray-200 rounded text-center text-sm"
                      placeholder="AAAA"
                    />
                  </td>
                  <td class="border border-gray-300 px-2 py-2">
                    <input
                      type="text"
                      [(ngModel)]="session.tecnico"
                      [ngModelOptions]="{standalone: true}"
                      (ngModelChange)="onSessionFieldChange()"
                      class="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      placeholder="Técnico"
                    />
                  </td>
                  <td class="border border-gray-300 px-2 py-2">
                    <input
                      type="time"
                      [(ngModel)]="session.hora"
                      [ngModelOptions]="{standalone: true}"
                      (ngModelChange)="onSessionFieldChange()"
                      class="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Important Notes -->
        <div class="mb-6">
          <div class="bg-green-100 p-4 rounded-md">
            <h4 class="font-medium text-gray-800 mb-2">NOTAS IMPORTANTES</h4>
            <p class="text-sm text-gray-700 mb-2">
              El Tratamiento deberá de realizarse cada tres días (ej) Lunes, Miércoles y Viernes o Martes, Jueves y Sábados
            </p>
            <p class="text-sm text-gray-700">
              Si no acude a alguna de sus citas favor de reportarse a la brevedad a Oftalmo Laser de Monterrey para reagendar el resto de sus sesiones
            </p>
          </div>
        </div>

        <!-- Additional Indications -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            INDICACIONES ADICIONALES
          </label>
          <textarea
            formControlName="additionalIndications"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese indicaciones adicionales para el tratamiento..."
          ></textarea>
        </div>

        <!-- Phone Lines -->
        <div class="bg-green-600 text-white text-center py-3 rounded-md mb-6">
          <div class="font-medium">
            {{ phoneLines.join(' | ') }}
          </div>
        </div>

        <!-- Auto-save indicator -->
        <div *ngIf="isSaving" class="flex items-center justify-center mb-4">
          <div class="flex items-center text-sm text-gray-600">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando automáticamente...
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4 justify-center">
          <button
            type="submit"
            [disabled]="isSaving"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            Guardar Tratamiento
          </button>
          
          <button
            type="button"
            (click)="onPrint()"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            🖨️ Imprimir
          </button>
          
          <button
            type="button"
            (click)="onCancel()"
            class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `
})
export class ValedaFormComponent implements OnInit, OnDestroy {
  @Input() treatment?: ValedaTreatment;
  @Output() saved = new EventEmitter<ValedaTreatment>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();

  treatmentForm!: FormGroup;
  currentDate: string;
  calculatedAge: number = 0;
  treatmentOptions = TREATMENT_EYE_OPTIONS;
  phoneLines = CLINIC_PHONE_LINES;
  spanishMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  
  sessions: any[] = [];
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<void>();
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private dateUtils: DateUtilsService,
    private valedaService: ValedaService
  ) {
    this.currentDate = this.dateUtils.getCurrentSpanishDate();
    this.initializeForm();
    this.initializeSessions();
  }

  ngOnInit(): void {
    // Set up debounced auto-save
    this.autoSaveSubject
      .pipe(
        debounceTime(1000), // Wait 1 second after last change
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.performAutoSave();
      });

    if (this.treatment) {
      this.loadTreatmentData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.treatmentForm = this.fb.group({
      patientName: ['', Validators.required],
      birthDate: ['', Validators.required],
      doctorName: ['', Validators.required],
      treatmentType: ['', Validators.required],
      additionalIndications: ['']
    });
  }

  private initializeSessions(): void {
    this.sessions = Array.from({ length: 9 }, (_, index) => ({
      sessionNumber: index + 1,
      day: null,
      month: '',
      year: new Date().getFullYear(),
      tecnico: '',
      hora: '',
      fecha: null
    }));
  }

  private loadTreatmentData(): void {
    if (!this.treatment) return;

    this.treatmentForm.patchValue({
      patientName: this.treatment.patient.nombre,
      birthDate: this.treatment.patient.fechaNacimiento.toISOString().split('T')[0],
      doctorName: this.treatment.doctor.nombre,
      treatmentType: this.treatment.tipoTratamiento,
      additionalIndications: this.treatment.indicacionesAdicionales || ''
    });

    this.calculatedAge = this.treatment.patient.edad || 0;

    // Load session data
    this.treatment.sessions.forEach((session, index) => {
      if (session.fecha) {
        const date = new Date(session.fecha);
        this.sessions[index] = {
          ...this.sessions[index],
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          tecnico: session.tecnico || '',
          hora: session.hora || '',
          fecha: session.fecha
        };
      } else {
        this.sessions[index] = {
          ...this.sessions[index],
          tecnico: session.tecnico || '',
          hora: session.hora || ''
        };
      }
    });
  }

  onBirthDateChange(): void {
    const birthDate = this.treatmentForm.get('birthDate')?.value;
    if (birthDate) {
      const date = new Date(birthDate);
      this.calculatedAge = this.dateUtils.calculateAge(date);
    }
  }

  updateSessionDate(index: number): void {
    const session = this.sessions[index];
    if (session.day && session.month !== '' && session.year) {
      session.fecha = new Date(session.year, session.month, session.day);
    } else {
      session.fecha = null;
    }
    // Trigger debounced auto-save when dates change
    this.autoSaveSubject.next();
  }

  onSessionFieldChange(): void {
    // Trigger debounced auto-save
    this.autoSaveSubject.next();
  }

  private performAutoSave(): void {
    // Only auto-save if we have an existing treatment and basic form is valid
    if (this.treatment?.id && this.treatmentForm.get('patientName')?.value && this.treatmentForm.get('doctorName')?.value) {
      this.isSaving = true;
      const formData = this.treatmentForm.value;
      
      const treatmentData: Partial<ValedaTreatment> = {
        patient: {
          nombre: formData.patientName,
          fechaNacimiento: new Date(formData.birthDate),
          edad: this.calculatedAge
        },
        doctor: {
          nombre: formData.doctorName
        },
        tipoTratamiento: formData.treatmentType,
        sessions: this.sessions.map(session => ({
          sessionNumber: session.sessionNumber,
          fecha: session.fecha,
          tecnico: session.tecnico || '',
          hora: session.hora || ''
        })),
        indicacionesAdicionales: formData.additionalIndications
      };

      this.valedaService.updateTreatment(this.treatment.id, treatmentData).subscribe({
        next: () => {
          this.isSaving = false;
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.treatmentForm.valid) {
      const formData = this.treatmentForm.value;
      
      const treatmentData: Omit<ValedaTreatment, 'id'> = {
        patient: {
          nombre: formData.patientName,
          fechaNacimiento: new Date(formData.birthDate),
          edad: this.calculatedAge
        },
        doctor: {
          nombre: formData.doctorName
        },
        fechaCreacion: this.treatment?.fechaCreacion || new Date(),
        tipoTratamiento: formData.treatmentType,
        sessions: this.sessions.map(session => ({
          sessionNumber: session.sessionNumber,
          fecha: session.fecha,
          tecnico: session.tecnico,
          hora: session.hora
        })),
        indicacionesAdicionales: formData.additionalIndications
      };

      if (this.treatment?.id) {
        // Update existing treatment
        this.valedaService.updateTreatment(this.treatment.id, treatmentData).subscribe(
          updatedTreatment => {
            if (updatedTreatment) {
              this.saved.emit(updatedTreatment);
            }
          }
        );
      } else {
        // Create new treatment
        this.valedaService.createTreatment(treatmentData).subscribe(
          newTreatment => {
            this.saved.emit(newTreatment);
          }
        );
      }
    }
  }

  onPrint(): void {
    // First save the treatment if it has changes
    if (this.treatmentForm.dirty) {
      this.onSubmit();
    }
    
    // Create a treatment object for printing
    const currentTreatment: ValedaTreatment = this.treatment || {
      id: 'temp',
      patient: {
        nombre: this.treatmentForm.get('patientName')?.value || '',
        fechaNacimiento: new Date(this.treatmentForm.get('birthDate')?.value),
        edad: this.calculatedAge
      },
      doctor: {
        nombre: this.treatmentForm.get('doctorName')?.value || ''
      },
      fechaCreacion: new Date(),
      tipoTratamiento: this.treatmentForm.get('treatmentType')?.value,
      sessions: this.sessions.map(session => ({
        sessionNumber: session.sessionNumber,
        fecha: session.fecha,
        tecnico: session.tecnico,
        hora: session.hora
      })),
      indicacionesAdicionales: this.treatmentForm.get('additionalIndications')?.value
    };

    this.printRequested.emit(currentTreatment);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}