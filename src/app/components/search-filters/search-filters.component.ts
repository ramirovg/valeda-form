import { Component, OnInit, Input, Output, EventEmitter, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchFilters } from '../../models/valeda.models';
import { ValedaService } from '../../services/valeda.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-search-filters',
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFiltersComponent implements OnInit {
  @Input() searchFilters: SearchFilters = {};
  @Output() searchFiltersChange = new EventEmitter<SearchFilters>();
  @Output() searchTriggered = new EventEmitter<void>();
  @Output() clearTriggered = new EventEmitter<void>();

  // Autocomplete properties
  patientNames: string[] = [];
  doctorNames: string[] = [];
  filteredPatientNames: string[] = [];
  filteredDoctorNames: string[] = [];
  showPatientSuggestions = false;
  showDoctorSuggestions = false;

  // Modern Angular dependency injection
  private readonly valedaService = inject(ValedaService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadAutocompleteData();
  }

  onPatientNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Update the filter and emit change
    this.searchFilters.name = value;
    this.searchFiltersChange.emit(this.searchFilters);
    
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
    
    // Update the filter and emit change
    this.searchFilters.doctor = value;
    this.searchFiltersChange.emit(this.searchFilters);
    
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
    this.searchFiltersChange.emit(this.searchFilters);
    this.showPatientSuggestions = false;
    this.filteredPatientNames = [];
    // Trigger search when selecting from autocomplete
    this.triggerSearch();
  }

  selectDoctorName(name: string): void {
    this.searchFilters.doctor = name;
    this.searchFiltersChange.emit(this.searchFilters);
    this.showDoctorSuggestions = false;
    this.filteredDoctorNames = [];
    // Trigger search when selecting from autocomplete
    this.triggerSearch();
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

  triggerSearch(): void {
    this.searchTriggered.emit();
  }

  clearSearch(): void {
    this.searchFilters = {};
    this.searchFiltersChange.emit(this.searchFilters);
    this.clearTriggered.emit();
  }

  trackByName(_index: number, name: string): string {
    return name;
  }

  highlightMatch(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<strong class="text-green-700">$1</strong>');
  }

  private loadAutocompleteData(): void {
    // Load patient names
    this.valedaService.getPatientNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (names) => {
          this.patientNames = names;
        },
        error: (error) => this.errorHandler.handleError(error, 'patients')
      });

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
}