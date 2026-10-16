import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
    TestBed.inject(TranslateService).setTranslation('en', {
      footer: {
        copyright: '© {{year}} Starter Kit',
        version: 'Version {{version}}',
      },
    });
  });

  it('shows the copyright and the app version on the left', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const start = (fixture.nativeElement as HTMLElement).querySelector(
      'footer .start',
    );

    expect(start?.querySelector('.copyright')?.textContent?.trim()).toBe(
      `© ${new Date().getFullYear()} Starter Kit`,
    );
    expect(start?.querySelector('.version')?.textContent?.trim()).toMatch(
      /^Version \d+\.\d+\.\d+/,
    );
  });
});
