import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  private readonly spanishMonths = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  constructor() { }

  /**
   * Formats a date to dd/mmm/yyyy format in Spanish
   * Example: 15/ene/2024
   */
  formatToSpanishDate(date: Date): string {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = this.spanishMonths[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Parses a Spanish date string back to Date object
   * Example: "15/ene/2024" -> Date object
   */
  parseSpanishDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const monthIndex = this.spanishMonths.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || monthIndex === -1 || isNaN(year)) {
      return null;
    }
    
    return new Date(year, monthIndex, day);
  }

  /**
   * Gets current date formatted in Spanish
   */
  getCurrentSpanishDate(): string {
    return this.formatToSpanishDate(new Date());
  }

  /**
   * Calculates age from birth date
   */
  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formats time to HH:mm format
   */
  formatTime(time: string | Date): string {
    if (!time) return '';
    
    if (typeof time === 'string') {
      // Assume time is already in correct format
      return time;
    }
    
    return time.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}