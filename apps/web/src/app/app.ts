import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { translate } from '@ngx-translate/core';
import { Footer } from './footer';
import { Toolbar } from './toolbar';

@Component({
  imports: [RouterOutlet, Toolbar, Footer],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly title = inject(Title);
  private readonly appTitle = translate('app.title');

  constructor() {
    // Keep the browser tab title in the active language.
    effect(() => this.title.setTitle(String(this.appTitle())));
  }
}
