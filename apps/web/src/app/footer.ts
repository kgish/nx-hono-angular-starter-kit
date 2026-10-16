import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly year = new Date().getFullYear();
  protected readonly version = version;
}
