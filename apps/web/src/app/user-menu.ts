import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore, LOGIN_PATH } from '@fullstack/web/data-access';
import { TranslatePipe } from '@ngx-translate/core';

/** The signed-in user's name and a sign-out button; empty when signed out. */
@Component({
  selector: 'app-user-menu',
  imports: [TranslatePipe],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenu {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl(LOGIN_PATH);
  }
}
