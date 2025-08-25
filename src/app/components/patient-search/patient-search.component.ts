import { Component, OnInit, Output, EventEmitter, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValedaService } from '../../services/valeda.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ValedaTreatment, SearchFilters } from '../../models/valeda.models';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';
import { TreatmentListComponent } from '../treatment-list/treatment-list.component';
import { NewPatientActionComponent } from '../new-patient-action/new-patient-action.component';

@Component({
  selector: 'app-patient-search',
  imports: [CommonModule, SearchFiltersComponent, TreatmentListComponent, NewPatientActionComponent],
  templateUrl: './patient-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientSearchComponent implements OnInit {
  @Output() treatmentSelected = new EventEmitter<ValedaTreatment>();
  @Output() createNewTreatment = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();

  searchFilters: SearchFilters = {};
  searchResults: ValedaTreatment[] = [];
  hasSearched = false;

  // Modern Angular dependency injection
  private readonly valedaService = inject(ValedaService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Load all treatments initially
    this.loadAllTreatments();
  }

  onSearchTriggered(): void {
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
    this.valedaService.searchTreatmentsFrontend(this.searchFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: results => {
          console.log('⚡ Frontend search results:', results.length, 'treatments');
          this.searchResults = results;
          this.cdr.markForCheck();
        },
        error: error => this.errorHandler.handleError(error, 'search')
      });
  }

  onClearTriggered(): void {
    this.searchFilters = {};
    this.hasSearched = false;
    this.loadAllTreatments();
  }

  onSearchFiltersChange(filters: SearchFilters): void {
    this.searchFilters = filters;
  }

  onCreateNew(): void {
    this.createNewTreatment.emit();
  }

  selectTreatment(treatment: ValedaTreatment): void {
    this.treatmentSelected.emit(treatment);
  }

  printTreatment(treatment: ValedaTreatment): void {
    this.printRequested.emit(treatment);
  }

  private loadAllTreatments(): void {
    this.valedaService.getTreatments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: treatments => {
          console.log('📊 All treatments loaded:', treatments.length, 'treatments');
          this.searchResults = treatments;
          this.cdr.markForCheck();
        },
        error: error => this.errorHandler.handleError(error, 'treatments')
      });
  }
}