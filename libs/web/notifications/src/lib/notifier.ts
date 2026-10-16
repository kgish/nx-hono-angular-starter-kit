import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Notification,
  type NotificationData,
  type NotificationType,
} from './notification';

/** How long each type stays up, in milliseconds. Failures get longer to read. */
export const NOTIFICATION_DURATIONS: Readonly<
  Record<NotificationType, number>
> = {
  success: 5000,
  info: 5000,
  failure: 10000,
};

/**
 * Shows short messages in a Material snackbar with a close button. Only one is
 * up at a time: a new one replaces the one showing. The app styles each type
 * through its `notification-<type>` panel class.
 */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, params?: Record<string, unknown>): void {
    this.show({ type: 'success', message, params });
  }

  failure(message: string, params?: Record<string, unknown>): void {
    this.show({ type: 'failure', message, params });
  }

  info(message: string, params?: Record<string, unknown>): void {
    this.show({ type: 'info', message, params });
  }

  private show(data: NotificationData): void {
    this.snackBar.openFromComponent(Notification, {
      data,
      duration: NOTIFICATION_DURATIONS[data.type],
      panelClass: ['notification', `notification-${data.type}`],
      // Screen readers interrupt for a failure, and wait for the rest.
      politeness: data.type === 'failure' ? 'assertive' : 'polite',
    });
  }
}
