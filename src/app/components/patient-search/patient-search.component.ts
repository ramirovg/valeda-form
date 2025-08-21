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
  template: `
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">Buscar Paciente</h2>
      
      <!-- Search Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Paciente
          </label>
          <input
            type="text"
            [(ngModel)]="searchFilters.nombre"
            (input)="onSearch()"
            placeholder="Buscar por nombre..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Médico
          </label>
          <input
            type="text"
            [(ngModel)]="searchFilters.doctor"
            (input)="onSearch()"
            placeholder="Buscar por médico..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div class="flex items-end">
          <button
            type="button"
            (click)="clearSearch()"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Limpiar Búsqueda
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 mb-6">
        <button
          type="button"
          (click)="onCreateNew()"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          + Nuevo Tratamiento
        </button>
        
        <button
          type="button"
          (click)="onSearch()"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          🔍 Buscar
        </button>
      </div>

      <!-- Search Results -->
      <div *ngIf="searchResults.length > 0" class="border border-gray-200 rounded-md">
        <div class="bg-gray-50 px-4 py-2 border-b">
          <h3 class="font-medium text-gray-800">Resultados de Búsqueda ({{ searchResults.length }})</h3>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          <div
            *ngFor="let treatment of searchResults; trackBy: trackByTreatment"
            class="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            (click)="selectTreatment(treatment)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{{ treatment.patient.nombre }}</h4>
                <p class="text-sm text-gray-600">
                  Edad: {{ treatment.patient.edad }} años | 
                  Nacimiento: {{ formatDate(treatment.patient.fechaNacimiento) }}
                </p>
                <p class="text-sm text-gray-600">
                  Médico: {{ treatment.doctor.nombre }}
                </p>
                <p class="text-sm text-gray-500">
                  Tratamiento: {{ getTreatmentTypeLabel(treatment.tipoTratamiento) }} |
                  Creado: {{ formatDate(treatment.fechaCreacion) }}
                </p>
              </div>
              
              <div class="flex gap-2">
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  [class]="getSessionStatusClass(treatment)"
                >
                  {{ getSessionStatusText(treatment) }}
                </span>
                
                <button
                  (click)="printTreatment(treatment, $event)"
                  class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  title="Imprimir"
                >
                  🖨️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div *ngIf="hasSearched && searchResults.length === 0" class="text-center py-8 text-gray-500">
        <p>No se encontraron resultados para la búsqueda actual.</p>
        <button
          type="button"
          (click)="onCreateNew()"
          class="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Crear Nuevo Tratamiento
        </button>
      </div>
    </div>
  `
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
      case 'ojo-derecho': return 'Ojo Derecho';
      case 'ojo-izquierdo': return 'Ojo Izquierdo';
      case 'ambos-ojos': return 'Ambos Ojos';
      default: return type;
    }
  }

  getSessionStatusClass(treatment: ValedaTreatment): string {
    const completedSessions = treatment.sessions.filter(s => s.fecha).length;
    if (completedSessions === 0) return 'bg-red-100 text-red-800';
    if (completedSessions < 9) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getSessionStatusText(treatment: ValedaTreatment): string {
    const completedSessions = treatment.sessions.filter(s => s.fecha).length;
    return `${completedSessions}/9 sesiones`;
  }

  trackByTreatment(index: number, treatment: ValedaTreatment): string {
    return treatment.id || index.toString();
  }
}