import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ValedaService } from '../../services/valeda.service';
import { ValedaTreatment, SearchFilters } from '../../models/valeda.models';
import { DateUtilsService } from '../../services/date-utils.service';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search.component.html',
})
export class PatientSearchComponent implements OnInit, OnDestroy {
  @Output() treatmentSelected = new EventEmitter<ValedaTreatment>();
  @Output() createNewTreatment = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();

  searchFilters: SearchFilters = {};
  searchResults: ValedaTreatment[] = [];
  hasSearched = false;
  private deleteTimeouts = new Map<string, any>();

  // Autocomplete properties
  patientNames: string[] = [];
  doctorNames: string[] = [];
  filteredPatientNames: string[] = [];
  filteredDoctorNames: string[] = [];
  showPatientSuggestions = false;
  showDoctorSuggestions = false;

  constructor(
    private valedaService: ValedaService,
    private dateUtils: DateUtilsService
  ) {}

  ngOnInit(): void {
    // Load all treatments initially
    this.loadAllTreatments();
    
    // Load autocomplete data
    this.loadAutocompleteData();
  }

  ngOnDestroy(): void {
    // Clear any pending timeouts
    this.deleteTimeouts.forEach(timeout => clearTimeout(timeout));
    this.deleteTimeouts.clear();
  }

  onSearch(): void {
    console.log('🔍 Searching with filters:', this.searchFilters);
    
    // Check if we have at least 3 characters in name or doctor fields to trigger search
    const hasMinimumChars = (this.searchFilters.name && this.searchFilters.name.trim().length >= 3) ||
                           (this.searchFilters.doctor && this.searchFilters.doctor.trim().length >= 3) ||
                           this.searchFilters.dateFrom ||
                           this.searchFilters.dateTo;
    
    if (!hasMinimumChars) {
      // If no minimum characters, show all treatments (reset search)
      this.hasSearched = false;
      this.loadAllTreatments();
      return;
    }

    this.hasSearched = true;

    // Frontend search (active - instant results, no caching issues)
    this.valedaService.searchTreatmentsFrontend(this.searchFilters).subscribe(
      results => {
        console.log('⚡ Frontend search results:', results.length, 'treatments');
        this.searchResults = results;
      }
    );

    // Backend search (available as fallback - scalable for large datasets)
    // Uncomment the lines below and comment the frontend search above to switch back
    // this.valedaService.searchTreatments(this.searchFilters).subscribe(
    //   results => {
    //     console.log('✅ Backend search results received:', results.length, 'treatments');
    //     this.searchResults = results;
    //   }
    // );
  }

  clearSearch(): void {
    this.searchFilters = {};
    this.hasSearched = false;
    this.loadAllTreatments();
  }

  onCreateNew(): void {
    this.createNewTreatment.emit();
  }

  selectTreatment(treatment: ValedaTreatment): void {
    this.treatmentSelected.emit(treatment);
  }

  printTreatment(treatment: ValedaTreatment, event: Event): void {
    event.stopPropagation();
    this.printRequested.emit(treatment);
  }

  private loadAllTreatments(): void {
    this.valedaService.getTreatments().subscribe(
      treatments => {
        this.searchResults = treatments;
      }
    );
  }

  formatDate(date: Date): string {
    return this.dateUtils.formatToSpanishDate(date);
  }

  getTreatmentTypeLabel(type: string): string {
    switch (type) {
      case 'right-eye': return 'Ojo Derecho';
      case 'left-eye': return 'Ojo Izquierdo';
      case 'both-eyes': return 'Ambos Ojos';
      default: return type;
    }
  }

  getSessionStatusClass(treatment: ValedaTreatment): string {
    const completedSessions = treatment.sessions.filter(s => s.date).length;
    if (completedSessions === 0) return 'bg-red-100 text-red-800';
    if (completedSessions < 9) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getSessionStatusText(treatment: ValedaTreatment): string {
    const completedSessions = treatment.sessions.filter(s => s.date).length;
    return `${completedSessions}/9 sesiones`;
  }

  trackByTreatment(index: number, treatment: ValedaTreatment): string {
    return treatment.id || index.toString();
  }

  initiateDelete(treatmentId: string, index: number): void {
    // Mark treatment for confirmation
    const treatment = this.searchResults[index];
    if (treatment) {
      (treatment as any).deleteConfirmation = true;
      
      // Auto-reset after 3 seconds
      const timeout = setTimeout(() => {
        this.resetDeleteConfirmation(treatmentId, index);
      }, 3000);
      
      this.deleteTimeouts.set(treatmentId, timeout);
    }
  }

  confirmDelete(treatmentId: string, index: number): void {
    // Validate treatment ID
    if (!treatmentId) {
      console.error('Cannot delete treatment: missing ID');
      this.showErrorMessage('Error: ID de tratamiento no encontrado');
      this.resetDeleteConfirmation(treatmentId, index);
      return;
    }

    // Clear timeout
    const timeout = this.deleteTimeouts.get(treatmentId);
    if (timeout) {
      clearTimeout(timeout);
      this.deleteTimeouts.delete(treatmentId);
    }
    
    // Show loading state
    const treatment = this.searchResults[index];
    if (treatment) {
      (treatment as any).deleting = true;
    }
    
    // Perform deletion
    this.valedaService.deleteTreatment(treatmentId).subscribe({
      next: (success) => {
        if (success) {
          // Show success message
          this.showSuccessMessage('Tratamiento eliminado correctamente');
          // Remove from list
          this.searchResults.splice(index, 1);
        } else {
          this.showErrorMessage('Error al eliminar el tratamiento');
          this.resetDeleteConfirmation(treatmentId, index);
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.showErrorMessage('Error al eliminar el tratamiento');
        this.resetDeleteConfirmation(treatmentId, index);
      }
    });
  }

  resetDeleteConfirmation(treatmentId: string, index: number): void {
    const treatment = this.searchResults[index];
    if (treatment) {
      (treatment as any).deleteConfirmation = false;
      (treatment as any).deleting = false;
    }
    this.deleteTimeouts.delete(treatmentId);
  }

  private showSuccessMessage(message: string): void {
    // Simple console log for now - can be enhanced with toast notifications later
    console.log('✅ Success:', message);
  }

  private showErrorMessage(message: string): void {
    // Simple console log for now - can be enhanced with toast notifications later
    console.error('❌ Error:', message);
  }

  private loadAutocompleteData(): void {
    // Load patient names
    this.valedaService.getPatientNames().subscribe(names => {
      this.patientNames = names;
    });

    // Load doctor names
    this.valedaService.getDoctorNames().subscribe(names => {
      this.doctorNames = names;
    });
  }

  onPatientNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Note: searchFilters.name is already updated by ngModel
    
    if (value) {
      this.filteredPatientNames = this.patientNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredPatientNames = [];
    }
    this.showPatientSuggestions = this.filteredPatientNames.length > 0;
  }

  onDoctorNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Note: searchFilters.doctor is already updated by ngModel
    
    if (value) {
      this.filteredDoctorNames = this.doctorNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredDoctorNames = [];
    }
    this.showDoctorSuggestions = this.filteredDoctorNames.length > 0;
  }

  selectPatientName(name: string): void {
    this.searchFilters.name = name;
    this.showPatientSuggestions = false;
    this.filteredPatientNames = [];
    // Trigger search when selecting from autocomplete
    this.onSearch();
  }

  selectDoctorName(name: string): void {
    this.searchFilters.doctor = name;
    this.showDoctorSuggestions = false;
    this.filteredDoctorNames = [];
    // Trigger search when selecting from autocomplete
    this.onSearch();
  }

  hidePatientSuggestions(): void {
    setTimeout(() => {
      this.showPatientSuggestions = false;
    }, 200);
  }

  hideDoctorSuggestions(): void {
    setTimeout(() => {
      this.showDoctorSuggestions = false;
    }, 200);
  }

  trackByName(index: number, name: string): string {
    return name;
  }

  highlightMatch(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<strong class="text-green-700">$1</strong>');
  }

  // Helper methods for delete state management
  isDeleteConfirmationVisible(treatment: ValedaTreatment): boolean {
    return !(treatment as any).deleteConfirmation && !(treatment as any).deleting;
  }

  isConfirmDeleteVisible(treatment: ValedaTreatment): boolean {
    return (treatment as any).deleteConfirmation && !(treatment as any).deleting;
  }

  isDeletingVisible(treatment: ValedaTreatment): boolean {
    return (treatment as any).deleting;
  }

  getTreatmentId(treatment: ValedaTreatment): string {
    const id = treatment.id || (treatment as any)._id || '';
    console.log('🔍 Treatment ID debug:', { treatment, id, hasId: !!treatment.id, has_id: !!(treatment as any)._id });
    return id;
  }
}
