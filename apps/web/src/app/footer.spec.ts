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

  it('shows the copyright on the left and the app version on the right', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const footer = (fixture.nativeElement as HTMLElement).querySelector(
      'footer',
    );

    expect(footer?.firstElementChild?.className).toBe('copyright');
    expect(footer?.firstElementChild?.textContent?.trim()).toBe(
      `© ${new Date().getFullYear()} Starter Kit`,
    );
    expect(footer?.lastElementChild?.className).toBe('version');
    expect(footer?.lastElementChild?.textContent?.trim()).toMatch(
      /^Version \d+\.\d+\.\d+/,
    );
  });
});
