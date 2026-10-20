import { Component, inject, OnInit } from '@angular/core';
import { isActive, Router, RouterLink } from '@angular/router';
import { AuthStore, LOGIN_PATH } from '@fullstack/web/data-access';
import { Logger } from '@fullstack/web/logging';
import { Notifier } from '@fullstack/web/notifications';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The signed-in user's name and a sign-out button, or a sign-in link once the
 * visitor is known to be signed out. The link is left out on the login page.
 * Signing out asks for confirmation in a modal dialog first.
 */
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu implements OnInit {
  private readonly logger = inject(Logger);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  protected readonly loginPath = LOGIN_PATH;
  protected readonly onLoginPage = isActive(LOGIN_PATH, this.router);

  ngOnInit(): void {
    this.logger.debug('UserMenu.ngOnInit');
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    this.notifier.success('auth.signedOut');
    await this.router.navigateByUrl(LOGIN_PATH);
  }
}
