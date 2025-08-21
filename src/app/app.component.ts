import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PatientSearchComponent } from './components/patient-search/patient-search.component';
import { ValedaFormComponent } from './components/valeda-form/valeda-form.component';
import { ValedaTreatment } from './models/valeda.models';

type ViewMode = 'search' | 'form';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, PatientSearchComponent, ValedaFormComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Valeda Form';
  currentView: ViewMode = 'search';
  selectedTreatment?: ValedaTreatment;

  onTreatmentSelected(treatment: ValedaTreatment): void {
    this.selectedTreatment = treatment;
    this.currentView = 'form';
  }

  onCreateNewTreatment(): void {
    this.selectedTreatment = undefined;
    this.currentView = 'form';
  }

  onTreatmentSaved(treatment: ValedaTreatment): void {
    // Optionally show success message
    this.backToSearch();
  }

  onFormCancelled(): void {
    this.backToSearch();
  }

  onPrintTreatment(treatment: ValedaTreatment): void {
    this.printTreatmentRecord(treatment);
  }

  private backToSearch(): void {
    this.selectedTreatment = undefined;
    this.currentView = 'search';
  }

  private printTreatmentRecord(treatment: ValedaTreatment): void {
    // Create a print-specific window with the treatment data
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(this.generatePrintHTML(treatment));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }

  private generatePrintHTML(treatment: ValedaTreatment): string {
    const formatDate = (date: Date) => {
      if (!date) return '';
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${date.getDate().toString().padStart(2, '0')}/${months[date.getMonth()]}/${date.getFullYear()}`;
    };

    const getTreatmentTypeLabel = (type: string) => {
      switch (type) {
        case 'ojo-derecho': return 'Ojo Derecho';
        case 'ojo-izquierdo': return 'Ojo Izquierdo';
        case 'ambos-ojos': return 'Ambos Ojos';
        default: return type;
      }
    };

    const currentDate = formatDate(new Date());

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tratamiento Valeda - ${treatment.patient.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .logo { height: 60px; object-fit: contain; }
          .company { margin-left: 15px; }
          .date-box { background: #16a34a; color: white; padding: 10px; border-radius: 5px; text-align: center; }
          .title { text-align: center; color: #2563eb; font-size: 20px; font-weight: bold; margin: 20px 0; }
          .form-section { margin-bottom: 15px; }
          .form-row { display: flex; margin-bottom: 10px; }
          .form-field { margin-right: 20px; }
          .sessions-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .sessions-table th, .sessions-table td { border: 1px solid #333; padding: 8px; text-align: left; }
          .sessions-table th { background: #f5f5f5; font-weight: bold; }
          .notes { background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .phone-lines { background: #16a34a; color: white; text-align: center; padding: 10px; border-radius: 5px; font-weight: bold; }
          @media print { 
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center;">
            <img src="assets/logo-oftalmolaser-color.png" alt="Oftalmo Laser de Monterrey" class="logo" />
          </div>
          <div class="date-box">
            <div style="font-size: 12px;">FECHA</div>
            <div style="font-size: 16px;">${currentDate}</div>
          </div>
        </div>

        <div class="title">TRATAMIENTO DE FOTOBIOMODULACIÓN CON VALEDA</div>

        <div class="form-section">
          <div class="form-row">
            <div class="form-field"><strong>Nombre del Paciente:</strong> ${treatment.patient.nombre}</div>
          </div>
          <div class="form-row">
            <div class="form-field"><strong>Fecha de Nacimiento:</strong> ${formatDate(treatment.patient.fechaNacimiento)}</div>
            <div class="form-field"><strong>Edad:</strong> ${treatment.patient.edad} años</div>
          </div>
          <div class="form-row">
            <div class="form-field"><strong>Nombre del Médico:</strong> ${treatment.doctor.nombre}</div>
          </div>
          <div class="form-row">
            <div class="form-field"><strong>Tx Valeda:</strong> ${getTreatmentTypeLabel(treatment.tipoTratamiento)}</div>
          </div>
        </div>

        <h3 style="text-align: center; margin: 20px 0;">FECHAS DE SESIONES DEL TRATAMIENTO</h3>
        
        <table class="sessions-table">
          <thead>
            <tr>
              <th>Sesión</th>
              <th>D</th>
              <th>M</th>
              <th>A</th>
              <th>Técnico</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            ${treatment.sessions.map(session => {
              const date = session.fecha ? new Date(session.fecha) : null;
              const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
              return `
                <tr>
                  <td>Sesión ${session.sessionNumber}</td>
                  <td>${date ? date.getDate().toString().padStart(2, '0') : ''}</td>
                  <td>${date ? months[date.getMonth()] : ''}</td>
                  <td>${date ? date.getFullYear() : ''}</td>
                  <td>${session.tecnico || ''}</td>
                  <td>${session.hora || ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="notes">
          <h4>NOTAS IMPORTANTES</h4>
          <p>El Tratamiento deberá de realizarse cada tres días (ej) Lunes, Miércoles y Viernes o Martes, Jueves y Sábados</p>
          <p>Si no acude a alguna de sus citas favor de reportarse a la brevedad a Oftalmo Laser de Monterrey para reagendar el resto de sus sesiones</p>
        </div>

        ${treatment.indicacionesAdicionales ? `
          <div class="form-section">
            <h4>INDICACIONES ADICIONALES</h4>
            <p>${treatment.indicacionesAdicionales}</p>
          </div>
        ` : ''}

        <div class="phone-lines" style="margin-top: 30px;">
          818318-6858 | 818318-6816 | 818318-6852 | 818318-6853 | 814444-2090
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  }
}
