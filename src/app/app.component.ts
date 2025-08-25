import { Component, PLATFORM_ID, inject, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PatientSearchComponent } from './components/patient-search/patient-search.component';
import { ValedaFormComponent } from './components/valeda-form/valeda-form.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ValedaTreatment } from './models/valeda.models';

type ViewMode = 'search' | 'form';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, PatientSearchComponent, ValedaFormComponent, NotificationComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  title = 'Sistema de Tratamiento de Fotobiomodulación';
  currentView: ViewMode = 'search';
  selectedTreatment: ValedaTreatment | undefined = undefined;

  ngOnInit(): void {
    console.log(`[AppComponent] ngOnInit, isBrowser: ${this.isBrowser}, currentView: ${this.currentView}`);
  }

  onTreatmentSelected(treatment: ValedaTreatment): void {
    console.log(`[AppComponent] onTreatmentSelected, currentView: ${this.currentView}`);
    this.selectedTreatment = treatment;
    this.currentView = 'form';
    console.log(`[AppComponent] onTreatmentSelected, new currentView: ${this.currentView}`);
  }

  onCreateNewTreatment(): void {
    console.log(`[AppComponent] onCreateNewTreatment, currentView: ${this.currentView}`);
    this.selectedTreatment = undefined;
    this.currentView = 'form';
    console.log(`[AppComponent] onCreateNewTreatment, new currentView: ${this.currentView}`);
  }

  onTreatmentSaved(_treatment: ValedaTreatment): void {
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
    console.log(`[AppComponent] backToSearch, currentView: ${this.currentView}`);
    this.selectedTreatment = undefined;
    this.currentView = 'search';
    console.log(`[AppComponent] backToSearch, new currentView: ${this.currentView}`);
  }

  private printTreatmentRecord(treatment: ValedaTreatment): void {
    if (!this.isBrowser) {
      return;
    }

    // Create a print-specific window with the treatment data
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(this.generatePrintHTML(treatment));
      printWindow.document.close();
      printWindow.focus();
      // Delay print to allow images and styles to load
      setTimeout(() => printWindow.print(), 500);
    }
  }

  private generatePrintHTML(treatment: ValedaTreatment): string {
    const formatDate = (date: Date | string | null | undefined) => {
      if (!date) return '';
      
      // Ensure we have a valid Date object
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${dateObj.getDate().toString().padStart(2, '0')}/${months[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
    };

    const getTreatmentTypeLabel = (type: string) => {
      switch (type) {
        case 'right-eye': return 'Ojo Derecho';
        case 'left-eye': return 'Ojo Izquierdo';
        case 'both-eyes': return 'Ambos Ojos';
        // Backward compatibility for old Spanish values
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
        <title>Tratamiento Valeda - ${treatment.patient.name}</title>
        <style>
          @page {
            size: A4;
            margin: 0.5in;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            color: #000;
            line-height: 1.2;
            font-size: 11px;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 8px 0;
            border-bottom: 2px solid #168D4D;
            margin-bottom: 12px;
          }
          .logo-section {
            display: flex;
            align-items: center;
          }
          .logo { 
            height: 35px; 
            object-fit: contain;
            margin-right: 12px;
          }
          .clinic-info {
            text-align: left;
          }
          .clinic-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #168D4D;
          }
          .clinic-subtitle {
            font-size: 9px;
            color: #666;
          }
          .date-box { 
            border: 1px solid #168D4D; 
            background: #f0fdf4;
            padding: 4px 8px; 
            text-align: center;
            font-size: 9px;
          }
          .title { 
            text-align: center; 
            font-size: 13px; 
            font-weight: bold; 
            margin: 8px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #168D4D;
            padding-bottom: 4px;
            color: #168D4D;
          }
          .patient-info {
            border: 1px solid #168D4D;
            background: #f9fdfb;
            padding: 8px;
            margin-bottom: 12px;
          }
          .patient-info h3 {
            margin: 0 0 6px 0;
            font-size: 11px;
            font-weight: bold;
            color: #166534;
          }
          .info-grid { 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 4px;
          }
          .form-field { 
            font-size: 9px;
          }
          .sessions-section {
            margin: 12px 0 8px 0;
          }
          .sessions-title {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .sessions-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 6px 0;
            font-size: 8px;
            border: 1px solid #168D4D;
          }
          .sessions-table th { 
            background: #f0fdf4;
            border: 1px solid #168D4D;
            padding: 3px 2px;
            text-align: center;
            font-weight: bold;
            font-size: 7px;
            text-transform: uppercase;
            color: #166534;
          }
          .sessions-table td { 
            border: 1px solid #168D4D;
            padding: 2px;
            text-align: center;
            font-size: 7px;
            height: 14px;
          }
          .sessions-table .session-num {
            width: 45px;
          }
          .sessions-table .day, .sessions-table .month {
            width: 22px;
          }
          .sessions-table .year {
            width: 32px;
          }
          .sessions-table .tech {
            width: 90px;
            text-align: left;
            padding-left: 3px;
          }
          .sessions-table .time {
            width: 35px;
          }
          .bottom-section {
            display: flex;
            gap: 8px;
            margin: 8px 0;
          }
          .notes { 
            flex: 1;
            border: 1px solid #168D4D;
            padding: 6px;
            background: #f9fdfb;
          }
          .notes h4 {
            margin: 0 0 4px 0;
            font-size: 9px;
            font-weight: bold;
            color: #166534;
          }
          .notes p {
            margin: 2px 0;
            font-size: 7px;
            line-height: 1.1;
          }
          .additional-indications {
            flex: 1;
            border: 1px solid #168D4D;
            padding: 6px;
            background: #f9fdfb;
          }
          .additional-indications h4 {
            margin: 0 0 4px 0;
            font-size: 9px;
            font-weight: bold;
            color: #166534;
          }
          .additional-indications p {
            font-size: 7px;
            margin: 0;
            line-height: 1.2;
          }
          .phone-lines { 
            border: 1px solid #168D4D; 
            background: #f0fdf4;
            text-align: center; 
            padding: 4px;
            font-weight: bold;
            margin: 6px 0;
            font-size: 8px;
            color: #166534;
          }
          .footer {
            text-align: center;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #168D4D;
            font-size: 7px;
            color: #166534;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="logo-oftalmolaser-color.png" alt="Oftalmolaser de Monterrey" class="logo" />
            <div class="clinic-info">
              <div class="clinic-name">OFTALMOLASER DE MONTERREY</div>
              <div class="clinic-subtitle">Centro Especializado en Oftalmología</div>
            </div>
          </div>
          <div class="date-box">
            <div style="font-weight: bold;">FECHA</div>
            <div>${currentDate}</div>
          </div>
        </div>

        <div class="title">Tratamiento de Fotobiomodulación con Valeda</div>

        <div class="patient-info">
          <h3>Información del Paciente</h3>
          <div class="info-grid">
            <div class="form-field"><strong>Paciente:</strong> ${treatment.patient.name}</div>
            <div class="form-field"><strong>Edad:</strong> ${treatment.patient.age} años</div>
            <div class="form-field"><strong>Nacimiento:</strong> ${formatDate(treatment.patient.birthDate)}</div>
            <div class="form-field"><strong>Tratamiento:</strong> ${getTreatmentTypeLabel(treatment.treatmentType)}</div>
          </div>
          <div class="form-field"><strong>Médico:</strong> ${treatment.doctor.name}</div>
        </div>

        <div class="sessions-section">
          <div class="sessions-title">Calendario de Sesiones</div>
          <table class="sessions-table">
            <thead>
              <tr>
                <th class="session-num">Sesión</th>
                <th class="day">D</th>
                <th class="month">M</th>
                <th class="year">A</th>
                <th class="tech">Técnico</th>
                <th class="time">Hora</th>
              </tr>
            </thead>
            <tbody>
              ${treatment.sessions.map(session => {
                const date = session.date ? new Date(session.date) : null;
                const isValidDate = date && !isNaN(date.getTime());
                const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                return `
                  <tr>
                    <td class="session-num">${session.sessionNumber}</td>
                    <td class="day">${isValidDate ? date!.getDate().toString().padStart(2, '0') : ''}</td>
                    <td class="month">${isValidDate ? months[date!.getMonth()] : ''}</td>
                    <td class="year">${isValidDate ? date!.getFullYear() : ''}</td>
                    <td class="tech">${session.technician || ''}</td>
                    <td class="time">${session.time || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="bottom-section">
          <div class="notes">
            <h4>INSTRUCCIONES</h4>
            <p><strong>Frecuencia:</strong> Cada 3 días (Ej: L-Mi-V)</p>
            <p><strong>Inasistencia:</strong> Reportar inmediatamente</p>
            <p><strong>Continuidad:</strong> Mantener regularidad</p>
          </div>
          
          <div class="additional-indications">
            <h4>INDICACIONES MÉDICAS</h4>
            <p>${treatment.additionalIndications || 'Espacio para observaciones del médico'}</p>
          </div>
        </div>

        <div class="phone-lines">
          Teléfonos: 818318-6858 | 818318-6816 | 818318-6852 | 818318-6853 | 814444-2090
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Oftalmolaser de Monterrey • Sistema Valeda</p>
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
