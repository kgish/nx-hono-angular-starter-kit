import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Notifier } from './notifier';

describe('Notifier', () => {
  let notifier: Notifier;
  let open: ReturnType<typeof vi.spyOn<MatSnackBar, 'openFromComponent'>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        {
          provide: MATERIAL_ANIMATIONS,
          useValue: { animationsDisabled: true },
        },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      greeting: 'Hello {{name}}',
      notifications: { close: 'Close' },
    });
    notifier = TestBed.inject(Notifier);
    open = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent');
  });

  const stable = () => TestBed.inject(ApplicationRef).whenStable();
  const shown = () => document.querySelector('lib-notification');

  it('shows the translated message with a close button', async () => {
    notifier.success('greeting', { name: 'Demo' });
    await stable();

    expect(shown()?.textContent).toContain('Hello Demo');
    expect(
      shown()?.querySelector('button.close')?.getAttribute('aria-label'),
    ).toBe('Close');
  });

  it('closes when the close button is clicked', async () => {
    notifier.info('greeting', { name: 'Demo' });
    await stable();
    const dismissed = firstValueFrom(
      open.mock.results[0].value.afterDismissed(),
    );

    shown()?.querySelector<HTMLButtonElement>('button.close')?.click();
    await dismissed;
    await stable();

    expect(shown()).toBeNull();
  });

  it.each([
    ['success', 5000, 'polite'],
    ['info', 5000, 'polite'],
    ['failure', 10000, 'assertive'],
  ] as const)(
    'keeps a %s notification up for %d ms',
    async (type, duration, politeness) => {
      notifier[type]('greeting');
      await stable();

      expect(open.mock.calls[0][1]).toMatchObject({
        data: { type, message: 'greeting' },
        duration,
        politeness,
        panelClass: ['notification', `notification-${type}`],
      });
    },
  );
});
