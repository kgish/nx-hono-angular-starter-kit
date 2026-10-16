import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

export type NotificationType = 'success' | 'failure' | 'info';

export interface NotificationData {
  readonly type: NotificationType;
  /** Translation key of the message. */
  readonly message: string;
  /** Interpolation parameters for the message. */
  readonly params?: Record<string, unknown>;
}

/** What the snackbar shows: a type icon, the message and a close button. */
@Component({
  selector: 'lib-notification',
  imports: [
    MatIconButton,
    MatSnackBarAction,
    MatSnackBarActions,
    MatSnackBarLabel,
    TranslatePipe,
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notification {
  private readonly ref = inject<MatSnackBarRef<Notification>>(MatSnackBarRef);
  protected readonly data = inject<NotificationData>(MAT_SNACK_BAR_DATA);

  protected close(): void {
    this.ref.dismiss();
  }
}
