import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValedaTreatment, Patient, Doctor, TREATMENT_EYE_OPTIONS, CLINIC_PHONE_LINES, TECHNICIANS_LIST } from '../../models/valeda.models';
import { DateUtilsService } from '../../services/date-utils.service';
import { ValedaService } from '../../services/valeda.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-valeda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './valeda-form.component.html',
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
  technicians = TECHNICIANS_LIST;
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
      month: null,
      year: new Date().getFullYear(),
      technician: '',
      time: '',
      date: null
    }));
  }

  private loadTreatmentData(): void {
    if (!this.treatment) return;

    this.treatmentForm.patchValue({
      patientName: this.treatment.patient.name,
      birthDate: this.treatment.patient.birthDate.toISOString().split('T')[0],
      doctorName: this.treatment.doctor.name,
      treatmentType: this.treatment.treatmentType,
      additionalIndications: this.treatment.additionalIndications || ''
    });

    this.calculatedAge = this.treatment.patient.age || 0;

    // Load session data
    this.treatment.sessions.forEach((session, index) => {
      if (session.date) {
        const date = new Date(session.date);
        this.sessions[index] = {
          ...this.sessions[index],
          day: date.getDate(),
          month: date.getMonth() + 1, // Convert from JS month (0-11) to user month (1-12)
          year: date.getFullYear(),
          technician: session.technician || '',
          time: session.time || '',
          date: session.date
        };
      } else {
        this.sessions[index] = {
          ...this.sessions[index],
          technician: session.technician || '',
          time: session.time || ''
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
    console.log(`📅 Updating session ${index + 1} date:`, {
      sessionNumber: session.sessionNumber,
      day: session.day,
      month: session.month,
      year: session.year
    });

    if (session.day && session.month && session.year && session.month >= 1 && session.month <= 12) {
      // Convert from user input (1-12) to JavaScript Date month (0-11)
      session.fecha = new Date(session.year, session.month - 1, session.day);
      console.log(`✅ Session ${index + 1} date created:`, session.fecha);
    } else {
      session.fecha = null;
      console.log(`❌ Session ${index + 1} date cleared (incomplete data)`);
    }
    // Trigger debounced auto-save when dates change
    this.autoSaveSubject.next();
  }

  onSessionFieldChange(): void {
    console.log('⏰ Session field changed, current sessions data:',
      this.sessions.map(s => ({
        session: s.sessionNumber,
        tecnico: s.tecnico,
        hora: s.hora,
        hasDate: !!s.fecha
      }))
    );
    // Trigger debounced auto-save
    this.autoSaveSubject.next();
  }

  private performAutoSave(): void {
    // Only auto-save if we have an existing treatment and basic form is valid
    if (this.treatment?.id && this.treatmentForm.get('patientName')?.value && this.treatmentForm.get('doctorName')?.value) {
      this.isSaving = true;
      const formData = this.treatmentForm.value;

      const sessionData = this.sessions.map(session => ({
        sessionNumber: session.sessionNumber,
        fecha: session.fecha,
        tecnico: session.tecnico || '',
        hora: session.hora || ''
      }));

      console.log('💾 Auto-saving treatment data:', {
        treatmentId: this.treatment.id,
        patientName: formData.patientName,
        sessionsWithData: sessionData.filter(s => s.tecnico || s.hora || s.fecha).length,
        sessionData: sessionData
      });

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
        sessions: sessionData,
        indicacionesAdicionales: formData.additionalIndications
      };

      this.valedaService.updateTreatment(this.treatment.id, treatmentData).subscribe({
        next: () => {
          console.log('✅ Auto-save completed successfully');
          this.isSaving = false;
        },
        error: (error) => {
          console.log('❌ Auto-save failed:', error);
          this.isSaving = false;
        }
      });
    } else {
      console.log('⏸️ Auto-save skipped (no treatment ID or missing required fields)');
    }
  }

  onSubmit(): void {
    if (this.treatmentForm.valid) {
      const formData = this.treatmentForm.value;

      const sessionData = this.sessions.map(session => ({
        sessionNumber: session.sessionNumber,
        fecha: session.fecha,
        tecnico: session.tecnico || '',
        hora: session.hora || ''
      }));

      console.log('📋 Submitting treatment form:', {
        isNewTreatment: !this.treatment?.id,
        patientName: formData.patientName,
        treatmentType: formData.treatmentType,
        sessionsWithData: sessionData.filter(s => s.tecnico || s.hora || s.fecha).length,
        fullSessionData: sessionData
      });

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
        sessions: sessionData,
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
