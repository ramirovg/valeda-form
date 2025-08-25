import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ValedaTreatment, TREATMENT_EYE_OPTIONS, CLINIC_PHONE_LINES, TECHNICIANS_LIST } from '../../models/valeda.models';
import { DateUtilsService } from '../../services/date-utils.service';
import { ValedaService } from '../../services/valeda.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ValedaFormBuilderService } from '../../services/form-builder.service';
import { ValidationUtils } from '../../utils/form-validators';

@Component({
  selector: 'app-valeda-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './valeda-form.component.html',
})
export class ValedaFormComponent implements OnInit, OnChanges {
  @Input() treatment: ValedaTreatment | undefined;
  @Output() saved = new EventEmitter<ValedaTreatment>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();

  // Helper method to get treatment ID, handling both 'id' and '_id' from MongoDB
  private getTreatmentId(): string | undefined {
    if (!this.treatment) return undefined;
    return this.treatment.id || (this.treatment as any)._id;
  }

  private syncSessionsToForm(): void {
    // Safety check: ensure form exists and is properly initialized
    if (!this.treatmentForm) {
      console.log('⚠️ Cannot sync sessions: form not initialized yet');
      return;
    }
    
    const sessionsFormArray = this.treatmentForm.get('sessions') as any;
    if (sessionsFormArray && sessionsFormArray.clear) {
      // Clear existing sessions in form
      sessionsFormArray.clear();
      
      // Add updated sessions from component state
      this.sessions.forEach(session => {
        sessionsFormArray.push(this.formBuilder.createSessionFormGroup(
          session.sessionNumber,
          {
            date: session.date,
            technician: session.technician || '',
            time: session.time || ''
          }
        ));
      });
      
      console.log('🔄 Synced sessions to reactive form:', this.sessions.length, 'sessions updated');
    } else {
      console.log('⚠️ Cannot sync sessions: sessions FormArray not available');
    }
  }

  treatmentForm!: FormGroup;
  currentDate: string;
  calculatedAge: number = 0;
  treatmentOptions = TREATMENT_EYE_OPTIONS;
  phoneLines = CLINIC_PHONE_LINES;
  technicians = TECHNICIANS_LIST;
  spanishMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  sessions: any[] = [];
  private autoSaveSubject = new Subject<void>();
  isSaving = false;

  // Autocomplete properties
  doctorNames: string[] = [];
  filteredFormDoctorNames: string[] = [];
  showFormDoctorSuggestions = false;

  // Modern Angular dependency injection
  private readonly dateUtils = inject(DateUtilsService);
  private readonly valedaService = inject(ValedaService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly formBuilder = inject(ValedaFormBuilderService);
  private readonly destroyRef = inject(DestroyRef);

  // Add validation utilities
  protected readonly ValidationUtils = ValidationUtils;

  constructor() {
    this.currentDate = this.dateUtils.getCurrentSpanishDate();
    this.initializeForm();
    this.initializeSessions();
  }

  ngOnInit(): void {
    console.log(`[ValedaForm] ngOnInit, treatment:`, this.getTreatmentId() ? `ID: ${this.getTreatmentId()}` : 'NEW');
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(`[ValedaForm] ngOnChanges, treatment:`, this.getTreatmentId() ? `ID: ${this.getTreatmentId()}` : 'NEW');
    console.log('Changes:', changes);
    if (changes['treatment']) {
      const previousTreatmentId = changes['treatment'].previousValue?.id || (changes['treatment'].previousValue as any)?._id;
      const currentTreatmentId = this.getTreatmentId();
      
      // Only re-initialize if we're switching to a different treatment or from no treatment to a treatment
      if (previousTreatmentId !== currentTreatmentId) {
        console.log(`🔄 Treatment changed from ${previousTreatmentId || 'none'} to ${currentTreatmentId || 'none'} - reinitializing form`);
        this.initializeComponent();
      } else {
        console.log(`⚠️ Same treatment detected, not reinitializing form to preserve user changes`);
      }
    }
  }

  private initializeComponent(): void {
    console.log(`[ValedaForm] initializeComponent, treatment:`, this.getTreatmentId() ? `ID: ${this.getTreatmentId()}` : 'NEW');
    
    // Initialize form first
    this.initializeForm();
    this.initializeSessions();
    
    // Set up debounced auto-save (only once)
    if (!this.autoSaveSubject.observers.length) {
      this.autoSaveSubject
        .pipe(
          debounceTime(1000), // Wait 1 second after last change
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.performAutoSave();
        });
    }

    // Load autocomplete data
    this.loadAutocompleteData();

    if (this.treatment) {
      this.loadTreatmentData();
    }
  }

  private initializeForm(): void {
    // Use the new form builder service for consistent structure
    this.treatmentForm = this.formBuilder.createTreatmentForm(this.treatment);
    
    console.log('🏗️ Form initialized:', {
      treatmentId: this.getTreatmentId(),
      formValid: this.treatmentForm.valid,
      formValues: {
        patientName: this.treatmentForm.get('patient.name')?.value,
        doctorName: this.treatmentForm.get('doctor.name')?.value,
        treatmentType: this.treatmentForm.get('treatmentType')?.value
      },
      fullFormValue: this.treatmentForm.value
    });
  }

  private initializeSessions(): void {
    console.log('🎬 Initializing sessions for', this.getTreatmentId() ? `existing treatment ${this.getTreatmentId()}` : 'new treatment');
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

    console.log('📥 Loading treatment data into form:', {
      treatmentId: this.getTreatmentId(),
      patientName: this.treatment.patient?.name,
      doctorName: this.treatment.doctor?.name,
      treatmentType: this.treatment.treatmentType,
      sessionsCount: this.treatment.sessions?.length || 0,
      fullTreatment: this.treatment
    });

    // The form builder service already handles loading the treatment data
    // We just need to update our calculated age and sessions tracking
    this.calculatedAge = this.treatment.patient.age || 0;

    // Update sessions tracking for the UI (keeping backward compatibility)
    this.sessions = this.treatment.sessions.map((session, index) => {
      if (session.date) {
        const date = new Date(session.date);
        const isValidDate = date && !isNaN(date.getTime());
        return {
          sessionNumber: index + 1,
          day: isValidDate ? date.getDate() : null,
          month: isValidDate ? date.getMonth() + 1 : null, // Convert from JS month (0-11) to user month (1-12)
          year: isValidDate ? date.getFullYear() : new Date().getFullYear(),
          technician: session.technician || '',
          time: session.time || '',
          date: session.date
        };
      } else {
        return {
          sessionNumber: index + 1,
          day: null,
          month: null,
          year: new Date().getFullYear(),
          technician: session.technician || '',
          time: session.time || '',
          date: null
        };
      }
    });

    // Ensure we have 9 sessions
    while (this.sessions.length < 9) {
      const index = this.sessions.length;
      this.sessions.push({
        sessionNumber: index + 1,
        day: null,
        month: null,
        year: new Date().getFullYear(),
        technician: '',
        time: '',
        date: null
      });
    }
  }

  onBirthDateChange(): void {
    const birthDate = this.treatmentForm.get('patient.birthDate')?.value;
    if (birthDate) {
      const date = new Date(birthDate);
      this.calculatedAge = this.dateUtils.calculateAge(date);
      // Update the age in the form as well
      this.treatmentForm.get('patient.age')?.setValue(this.calculatedAge);
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
      session.date = new Date(session.year, session.month - 1, session.day);
      console.log(`✅ Session ${index + 1} date created:`, session.date);
    } else {
      session.date = null;
      console.log(`❌ Session ${index + 1} date cleared (incomplete data)`);
    }
    
    // Update the reactive form sessions array as well
    this.syncSessionsToForm();
    
    // Trigger debounced auto-save when dates change
    this.autoSaveSubject.next();
  }

  onSessionFieldChange(): void {
    console.log('⏰ Session field changed, current sessions data:',
      this.sessions.map(s => ({
        session: s.sessionNumber,
        technician: s.technician,
        time: s.time,
        hasDate: !!s.date
      }))
    );
    
    // Sync sessions to reactive form
    this.syncSessionsToForm();
    
    // Trigger debounced auto-save
    this.autoSaveSubject.next();
  }

  private performAutoSave(): void {
    // Only auto-save if we have an existing treatment and basic form is valid
    const patientName = this.treatmentForm.get('patient.name')?.value;
    const doctorName = this.treatmentForm.get('doctor.name')?.value;
    
    if (this.getTreatmentId() && patientName && doctorName) {
      this.isSaving = true;
      const formData = this.treatmentForm.value;
      const patientData = formData.patient;
      const doctorData = formData.doctor;
      const sessionsData = formData.sessions || [];

      const treatmentId = this.getTreatmentId()!;
      console.log('💾 Auto-saving treatment data:', {
        treatmentId: treatmentId,
        patientName: patientData?.name,
        sessionsWithData: sessionsData.filter((s: any) => s.technician || s.time || s.date).length,
        sessionsData: sessionsData
      });

      const treatmentData: Partial<ValedaTreatment> = {
        patient: {
          name: patientData.name,
          birthDate: new Date(patientData.birthDate),
          age: patientData.age || this.calculatedAge
        },
        doctor: {
          name: doctorData.name
        },
        treatmentType: formData.treatmentType,
        sessions: sessionsData.map((session: any) => ({
          sessionNumber: session.sessionNumber,
          date: session.date,
          technician: session.technician || '',
          time: session.time || ''
        })),
        additionalIndications: formData.additionalIndications
      };

      this.valedaService.updateTreatment(treatmentId, treatmentData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedTreatment) => {
            if (updatedTreatment) {
              console.log('✅ Auto-save completed successfully');
              this.isSaving = false;
            } else {
              console.log('⚠️ Auto-save returned null - possible error');
              this.isSaving = false;
            }
          },
          error: (error) => {
            console.log('❌ Auto-save failed:', error);
            this.errorHandler.handleError(error, 'auto-save');
            this.isSaving = false;
          }
        });
    } else {
      console.log('⏸️ Auto-save skipped (no treatment ID or missing required fields)');
    }
  }

  onSubmit(): void {
    console.log('📝 Form submission started:', {
      formValid: this.treatmentForm.valid,
      formErrors: this.treatmentForm.errors,
      treatmentId: this.getTreatmentId(),
      originalTreatment: this.treatment,
      formValue: this.treatmentForm.value
    });

    // Auto-fill missing required fields
    this.autoFillMissingFields();

    console.log('📝 After auto-fill:', {
      formValid: this.treatmentForm.valid,
      formErrors: this.treatmentForm.errors,
      updatedFormValue: this.treatmentForm.value,
      formControls: {
        patientName: this.treatmentForm.get('patient.name')?.value,
        doctorName: this.treatmentForm.get('doctor.name')?.value,
        treatmentType: this.treatmentForm.get('treatmentType')?.value,
        additionalIndications: this.treatmentForm.get('additionalIndications')?.value
      }
    });

    if (this.treatmentForm.valid) {
      const formData = this.treatmentForm.value;

      // Extract data from the structured form
      const patientData = formData.patient;
      const doctorData = formData.doctor;
      const sessionsData = formData.sessions || [];

      console.log('📋 Submitting treatment form:', {
        isNewTreatment: !this.getTreatmentId(),
        treatmentId: this.getTreatmentId(),
        originalTreatment: this.treatment,
        patientName: patientData?.name,
        treatmentType: formData.treatmentType,
        sessionsWithData: sessionsData.filter((s: any) => s.technician || s.time || s.date).length,
        fullFormData: formData,
        actualInputValues: {
          patientName: this.treatmentForm.get('patient.name')?.value,
          doctorName: this.treatmentForm.get('doctor.name')?.value,
          treatmentType: this.treatmentForm.get('treatmentType')?.value
        }
      });

      const treatmentData: Omit<ValedaTreatment, 'id'> = {
        patient: {
          name: patientData.name,
          birthDate: new Date(patientData.birthDate),
          age: patientData.age || this.calculatedAge
        },
        doctor: {
          name: doctorData.name
        },
        creationDate: this.treatment?.creationDate || new Date(),
        treatmentType: formData.treatmentType,
        sessions: sessionsData.map((session: any) => ({
          sessionNumber: session.sessionNumber,
          date: session.date,
          technician: session.technician || '',
          time: session.time || ''
        })),
        additionalIndications: formData.additionalIndications
      };

      const treatmentId = this.getTreatmentId();
      if (treatmentId) {
        // Update existing treatment
        this.valedaService.updateTreatment(treatmentId, treatmentData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (updatedTreatment) => {
              console.log('✅ Update response received:', updatedTreatment);
              if (updatedTreatment) {
                this.errorHandler.showNotification({
                  type: 'success',
                  title: 'Éxito',
                  message: 'Tratamiento actualizado correctamente',
                  autoClose: true,
                  duration: 3000
                });
                this.saved.emit(updatedTreatment);
              } else {
                console.error('❌ Update failed - null response');
                this.errorHandler.handleError(new Error('Update failed'), 'update');
              }
            },
            error: (error) => {
              console.error('❌ Update error:', error);
              this.errorHandler.handleError(error, 'update');
            }
          });
      } else {
        // Create new treatment
        this.valedaService.createTreatment(treatmentData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (newTreatment) => {
              this.errorHandler.showNotification({
                type: 'success',
                title: 'Éxito',
                message: 'Tratamiento creado correctamente',
                autoClose: true,
                duration: 3000
              });
              this.saved.emit(newTreatment);
            },
            error: (error) => this.errorHandler.handleError(error, 'create')
          });
      }
    } else {
      console.error('❌ Form is invalid:', {
        formErrors: this.treatmentForm.errors,
        formStatus: this.treatmentForm.status,
        invalidControls: this.getInvalidControls()
      });
    }
  }

  private autoFillMissingFields(): void {
    console.log('🔧 Auto-filling missing required fields...');
    
    // Fill patient name if empty
    const patientName = this.treatmentForm.get('patient.name');
    if (patientName && (!patientName.value || patientName.value.trim() === '')) {
      patientName.setValue('Paciente Sin Nombre');
      console.log('✏️ Auto-filled patient name');
    }
    
    // Fill doctor name if empty
    const doctorName = this.treatmentForm.get('doctor.name');
    if (doctorName && (!doctorName.value || doctorName.value.trim() === '')) {
      doctorName.setValue('Dr. Sin Nombre');
      console.log('✏️ Auto-filled doctor name');
    }
    
    // Fill birth date if empty
    const birthDate = this.treatmentForm.get('patient.birthDate');
    if (birthDate && (!birthDate.value || birthDate.value.trim() === '')) {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() - 50); // Default 50 years old
      birthDate.setValue(defaultDate.toISOString().split('T')[0]);
      console.log('✏️ Auto-filled birth date');
    }
    
    // Fill treatment type if empty
    const treatmentType = this.treatmentForm.get('treatmentType');
    if (treatmentType && (!treatmentType.value || treatmentType.value.trim() === '')) {
      treatmentType.setValue('both-eyes');
      console.log('✏️ Auto-filled treatment type');
    }
    
    // Auto-calculate age if birth date is available
    this.onBirthDateChange();
  }

  private getInvalidControls(): any {
    const invalidControls: any = {};
    
    const checkControlsRecursively = (controls: any, prefix = '') => {
      for (const name in controls) {
        const control = controls[name];
        const fullName = prefix ? `${prefix}.${name}` : name;
        
        if (control.invalid) {
          invalidControls[fullName] = {
            errors: control.errors,
            value: control.value,
            status: control.status
          };
        }
        
        // Check nested form groups
        if (control.controls) {
          checkControlsRecursively(control.controls, fullName);
        }
        
        // Check form arrays
        if (control.length !== undefined) {
          for (let i = 0; i < control.length; i++) {
            if (control.at(i).invalid) {
              const arrayName = `${fullName}[${i}]`;
              invalidControls[arrayName] = {
                errors: control.at(i).errors,
                value: control.at(i).value,
                status: control.at(i).status
              };
              
              // Check nested controls in form array
              if (control.at(i).controls) {
                checkControlsRecursively(control.at(i).controls, arrayName);
              }
            }
          }
        }
      }
    };
    
    checkControlsRecursively(this.treatmentForm.controls);
    return invalidControls;
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
        name: this.treatmentForm.get('patientName')?.value || '',
        birthDate: new Date(this.treatmentForm.get('birthDate')?.value),
        age: this.calculatedAge
      },
      doctor: {
        name: this.treatmentForm.get('doctorName')?.value || ''
      },
      creationDate: new Date(),
      treatmentType: this.treatmentForm.get('treatmentType')?.value,
      sessions: this.sessions.map(session => ({
        sessionNumber: session.sessionNumber,
        date: session.date,
        technician: session.technician,
        time: session.time
      })),
      additionalIndications: this.treatmentForm.get('additionalIndications')?.value
    };

    this.printRequested.emit(currentTreatment);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private loadAutocompleteData(): void {
    // Load doctor names
    this.valedaService.getDoctorNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (names) => {
          this.doctorNames = names;
        },
        error: (error) => this.errorHandler.handleError(error, 'doctors')
      });
  }

  onFormDoctorNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (value) {
      this.filteredFormDoctorNames = this.doctorNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredFormDoctorNames = [];
    }
    this.showFormDoctorSuggestions = this.filteredFormDoctorNames.length > 0;
  }

  selectFormDoctorName(name: string): void {
    this.treatmentForm.patchValue({ 
      doctor: { name: name }
    });
    this.showFormDoctorSuggestions = false;
    this.filteredFormDoctorNames = [];
  }

  hideFormDoctorSuggestions(): void {
    setTimeout(() => {
      this.showFormDoctorSuggestions = false;
    }, 200);
  }

  trackByName(_index: number, name: string): string {
    return name;
  }

  highlightMatch(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<strong class="text-blue-700">$1</strong>');
  }
}
