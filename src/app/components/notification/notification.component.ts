import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService, ErrorNotification } from '../../services/error-handler.service';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  private readonly errorHandler = inject(ErrorHandlerService);
  
  // Access notifications signal
  notifications = this.errorHandler.notifications;

  /**
   * Get CSS classes for notification type
   */
  getNotificationClasses(notification: ErrorNotification): string {
    const baseClasses = 'notification-toast fixed top-4 right-4 z-50 max-w-md p-4 mb-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform';
    
    const typeClasses: Record<ErrorNotification['type'], string> = {
      error: 'bg-red-50 border-l-4 border-red-400 text-red-700',
      warning: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700', 
      info: 'bg-blue-50 border-l-4 border-blue-400 text-blue-700',
      success: 'bg-green-50 border-l-4 border-green-400 text-green-700'
    };

    return `${baseClasses} ${typeClasses[notification.type]}`;
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type: ErrorNotification['type']): string {
    const icons: Record<ErrorNotification['type'], string> = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type];
  }

  /**
   * Close notification
   */
  closeNotification(id: string): void {
    this.errorHandler.removeNotification(id);
  }

  /**
   * Close all notifications
   */
  closeAll(): void {
    this.errorHandler.clearAllNotifications();
  }
}
