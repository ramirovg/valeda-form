import { Component, Input, Output, EventEmitter, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValedaTreatment } from '../../models/valeda.models';
import { ValedaService } from '../../services/valeda.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { DateUtilsService } from '../../services/date-utils.service';

@Component({
  selector: 'app-treatment-list',
  imports: [CommonModule],
  templateUrl: './treatment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentListComponent {
  @Input() treatments: ValedaTreatment[] = [];
  @Input() hasSearched = false;
  @Output() treatmentSelected = new EventEmitter<ValedaTreatment>();
  @Output() printRequested = new EventEmitter<ValedaTreatment>();
  @Output() createNewRequested = new EventEmitter<void>();

  private deleteTimeouts = new Map<string, any>();

  // Modern Angular dependency injection
  private readonly valedaService = inject(ValedaService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnDestroy(): void {
    // Clear any pending timeouts
    this.deleteTimeouts.forEach(timeout => clearTimeout(timeout));
    this.deleteTimeouts.clear();
  }

  selectTreatment(treatment: ValedaTreatment): void {
    this.treatmentSelected.emit(treatment);
  }

  printTreatment(treatment: ValedaTreatment, event: Event): void {
    event.stopPropagation();
    this.printRequested.emit(treatment);
  }

  onCreateNew(): void {
    this.createNewRequested.emit();
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
    const treatment = this.treatments[index];
    if (treatment) {
      (treatment as any).deleteConfirmation = true;
      this.cdr.markForCheck();
      
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
      this.errorHandler.showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error: ID de tratamiento no encontrado',
        autoClose: true,
        duration: 5000
      });
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
    const treatment = this.treatments[index];
    if (treatment) {
      (treatment as any).deleting = true;
      this.cdr.markForCheck();
    }
    
    // Perform deletion - try API first, then localStorage
    this.valedaService.deleteTreatment(treatmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          if (success) {
            // Show success message
            this.errorHandler.showNotification({
              type: 'success',
              title: 'Éxito',
              message: 'Tratamiento eliminado correctamente',
              autoClose: true,
              duration: 3000
            });
            // Remove from list and update display
            this.treatments.splice(index, 1);
            this.cdr.markForCheck();
          } else {
            console.warn('API delete failed, trying localStorage fallback');
            this.deleteFromLocalStorage(treatmentId, index);
          }
        },
        error: (error) => {
          console.warn('API delete error, trying localStorage fallback:', error);
          this.deleteFromLocalStorage(treatmentId, index);
        }
      });
  }

  resetDeleteConfirmation(treatmentId: string, index: number): void {
    const treatment = this.treatments[index];
    if (treatment) {
      (treatment as any).deleteConfirmation = false;
      (treatment as any).deleting = false;
      this.cdr.markForCheck();
    }
    this.deleteTimeouts.delete(treatmentId);
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

  private deleteFromLocalStorage(treatmentId: string, index: number): void {
    try {
      // Delete from localStorage
      const stored = localStorage.getItem('valeda-treatments');
      if (stored) {
        const treatments = JSON.parse(stored);
        const updatedTreatments = treatments.filter((t: any) => 
          (t.id || t._id) !== treatmentId
        );
        localStorage.setItem('valeda-treatments', JSON.stringify(updatedTreatments));
      }
      
      // Show success message
      this.errorHandler.showNotification({
        type: 'success',
        title: 'Éxito',
        message: 'Tratamiento eliminado correctamente',
        autoClose: true,
        duration: 3000
      });
      
      // Remove from display list
      this.treatments.splice(index, 1);
      this.cdr.markForCheck();
      
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      this.errorHandler.showNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el tratamiento',
        autoClose: true,
        duration: 5000
      });
      this.resetDeleteConfirmation(treatmentId, index);
    }
  }
}