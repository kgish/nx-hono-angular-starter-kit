import { Component, inject, OnInit } from '@angular/core';
import { Logger } from '@fullstack/web/logging';
import { TranslatePipe } from '@ngx-translate/core';
// The version lives in the root package.json, which belongs to no Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { version } from '../../../../package.json';

/** The bar at the bottom of every page: copyright and app version. */
@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnInit {
  private readonly logger = inject(Logger);
  protected readonly year = new Date().getFullYear();
  protected readonly version = version;

  ngOnInit(): void {
    this.logger.debug('Footer.ngOnInit');
  }
}
