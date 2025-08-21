import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
export class PatientSearchComponent implements OnInit {
  @Output() treatmentSelected = new EventEmitter<ValedaTreatment>();
  @Output() createNewTreatment = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();

  searchFilters: SearchFilters = {};
  searchResults: ValedaTreatment[] = [];
  hasSearched = false;

  constructor(
    private valedaService: ValedaService,
    private dateUtils: DateUtilsService
  ) {}

  ngOnInit(): void {
    // Load all treatments initially
    this.loadAllTreatments();
  }

  onSearch(): void {
    this.hasSearched = true;
    this.valedaService.searchTreatments(this.searchFilters).subscribe(
      results => {
        this.searchResults = results;
      }
    );
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
}
