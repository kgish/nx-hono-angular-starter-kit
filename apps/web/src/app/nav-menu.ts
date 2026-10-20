import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@fullstack/web/data-access';
import { Logger } from '@fullstack/web/logging';
import { TranslatePipe } from '@ngx-translate/core';

interface NavLink {
  readonly path: string;
  /** Translation key of the link text. */
  readonly label: string;
}

const USER_LINKS: readonly NavLink[] = [{ path: '/', label: 'nav.todos' }];

// Sign in is not listed: the toolbar has its own sign-in button.
const GUEST_LINKS: readonly NavLink[] = [
  { path: '/register', label: 'nav.register' },
];

/**
 * The hamburger button and the navigation drawer it opens. The drawer lists
 * the pages open to the current visitor and closes on a link, Escape, or a
 * click outside it.
 */
@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss',
  host: {
    '(document:click)': 'closeOnOutsideClick($event)',
    '(document:keydown.escape)': 'closeAndRefocus()',
  },
})
export class NavMenu implements OnInit {
  private readonly logger = inject(Logger);
  private readonly auth = inject(AuthStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toggleButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('toggleButton');

  protected readonly open = signal(false);
  protected readonly links = computed(() =>
    this.auth.isAuthenticated() ? USER_LINKS : GUEST_LINKS,
  );

  ngOnInit(): void {
    this.logger.debug('NavMenu.ngOnInit');
  }

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected closeOnOutsideClick(event: MouseEvent): void {
    if (
      this.open() &&
      !this.host.nativeElement.contains(event.target as Node | null)
    ) {
      this.close();
    }
  }

  protected closeAndRefocus(): void {
    if (!this.open()) return;
    this.close();
    this.toggleButton().nativeElement.focus();
  }
}
