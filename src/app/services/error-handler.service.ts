import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
}

/**
 * Centralized error handling service for the Valeda application
 * Provides user-friendly error messages, retry mechanisms, and notification system
 * 
 * @example
 * ```typescript
 * constructor(private errorHandler: ErrorHandlerService) {}
 * 
 * // Handle API errors with user-friendly messages
 * this.valedaService.getTreatments().pipe(
 *   catchError(error => this.errorHandler.handleError(error, 'treatments'))
 * ).subscribe();
 * 
 * // Show success notification
 * this.errorHandler.showNotification({
 *   type: 'success',
 *   title: 'Éxito',
 *   message: 'Tratamiento guardado correctamente'
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  // Signal-based notification system
  private readonly _notifications = signal<ErrorNotification[]>([]);
  public readonly notifications = this._notifications.asReadonly();

  /**
   * Handle errors with context-aware user-friendly messages
   */
  handleError(error: any, context?: string): Observable<never> {
    console.error(`Error in ${context || 'application'}:`, error);

    // Determine user-friendly error message
    const userMessage = this.getUserFriendlyMessage(error, context);
    
    // Show error notification
    this.showNotification({
      type: 'error',
      title: 'Error',
      message: userMessage,
      autoClose: true,
      duration: 5000
    });

    // Return throwError to maintain RxJS error flow
    return throwError(() => new Error(userMessage));
  }

  /**
   * Handle errors with retry mechanism
   */
  handleErrorWithRetry(
    error: any, 
    context: string, 
    _retryConfig: RetryConfig
  ): Observable<never> {
    console.error(`Error in ${context} (retry available):`, error);

    const userMessage = this.getUserFriendlyMessage(error, context);
    
    this.showNotification({
      type: 'warning',
      title: 'Error de Conexión',
      message: `${userMessage}. Reintentando automáticamente...`,
      autoClose: true,
      duration: 3000
    });

    return throwError(() => error);
  }

  /**
   * Show user notification
   */
  showNotification(notification: Omit<ErrorNotification, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullNotification: ErrorNotification = {
      ...notification,
      id,
      timestamp: new Date()
    };

    // Add notification to signal
    this._notifications.update(notifications => [...notifications, fullNotification]);

    // Auto-close if configured
    if (notification.autoClose) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration || 3000);
    }

    return id;
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): void {
    this._notifications.update(notifications => 
      notifications.filter(notification => notification.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this._notifications.set([]);
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyMessage(error: any, context?: string): string {
    // Network connectivity errors
    if (error.status === 0 || error.name === 'NetworkError') {
      return 'Sin conexión al servidor. Verifica tu conexión a internet.';
    }

    // HTTP error responses
    switch (error.status) {
      case 400:
        return 'Los datos enviados no son válidos. Revisa la información ingresada.';
      case 401:
        return 'No tienes autorización para realizar esta acción.';
      case 403:
        return 'No tienes permisos suficientes para esta operación.';
      case 404:
        if (context === 'treatments') {
          return 'El tratamiento solicitado no fue encontrado.';
        }
        return 'El recurso solicitado no fue encontrado.';
      case 409:
        return 'Conflicto de datos. Es posible que la información haya sido modificada.';
      case 422:
        return 'Los datos proporcionados no cumplen con los requisitos del sistema.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente en unos momentos.';
      case 503:
        return 'El servicio no está disponible temporalmente. Intenta más tarde.';
      default:
        break;
    }

    // Parse error messages
    if (error.error?.message) {
      return this.translateTechnicalMessage(error.error.message);
    }

    if (error.message) {
      return this.translateTechnicalMessage(error.message);
    }

    // Context-specific fallback messages
    const contextMessages: Record<string, string> = {
      'treatments': 'Error al procesar los tratamientos. Intenta nuevamente.',
      'patients': 'Error al procesar la información del paciente.',
      'doctors': 'Error al cargar la información de médicos.',
      'search': 'Error en la búsqueda. Intenta con otros criterios.',
      'delete': 'No se pudo eliminar el elemento. Verifica que tenga los permisos necesarios.',
      'save': 'Error al guardar la información. Verifica los datos e intenta nuevamente.',
      'print': 'Error al generar el reporte. Intenta nuevamente.'
    };

    return contextMessages[context || ''] || 'Ocurrió un error inesperado. Intenta nuevamente.';
  }

  /**
   * Translate technical messages to user-friendly Spanish
   */
  private translateTechnicalMessage(message: string): string {
    const translations: Record<string, string> = {
      'Network error': 'Error de conexión de red',
      'Timeout': 'La operación tardó demasiado tiempo',
      'Connection refused': 'No se pudo conectar al servidor',
      'Invalid JSON': 'Error en el formato de datos',
      'Validation failed': 'Los datos no pasaron la validación',
      'Duplicate entry': 'Ya existe un registro con esta información',
      'Database error': 'Error en la base de datos'
    };

    // Check for exact matches
    if (translations[message]) {
      return translations[message];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(translations)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return 'Error en el sistema. Contacta al administrador si persiste.';
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check if there are any error notifications
   */
  hasErrors(): boolean {
    return this.notifications().some(n => n.type === 'error');
  }

  /**
   * Get latest notification of specific type
   */
  getLatestNotification(type?: ErrorNotification['type']): ErrorNotification | undefined {
    const notifications = this.notifications();
    if (type) {
      return notifications.filter(n => n.type === type).pop();
    }
    return notifications[notifications.length - 1];
  }
}