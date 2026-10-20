import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logger } from '@fullstack/web/logging';
import { LanguageSwitcher } from './language-switcher';
import { NavMenu } from './nav-menu';
import { UserMenu } from './user-menu';

/** The bar at the top of every page: menu and title, then account and language. */
@Component({
  selector: 'app-toolbar',
  imports: [RouterLink, NavMenu, UserMenu, LanguageSwitcher],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar implements OnInit {
  private readonly logger = inject(Logger);

  ngOnInit(): void {
    this.logger.debug('Toolbar.ngOnInit');
  }
}
