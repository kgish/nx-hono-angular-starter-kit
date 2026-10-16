import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { isActive, Router, RouterLink } from '@angular/router';
import { AuthStore, LOGIN_PATH } from '@fullstack/web/data-access';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The signed-in user's name and a sign-out button, or a sign-in link once the
 * visitor is known to be signed out. The link is left out on the login page.
 */
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenu {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loginPath = LOGIN_PATH;
  protected readonly onLoginPage = isActive(LOGIN_PATH, this.router);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl(LOGIN_PATH);
  }
}
