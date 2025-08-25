import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-patient-action',
  imports: [CommonModule],
  templateUrl: './new-patient-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewPatientActionComponent {
  @Output() createNewRequested = new EventEmitter<void>();

  onCreateNew(): void {
    this.createNewRequested.emit();
  }
}