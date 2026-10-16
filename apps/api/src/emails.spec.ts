import { describe, expect, it } from 'bun:test';
import { emailLanguage, resetPasswordEmail } from './emails';

describe('emailLanguage', () => {
  it('picks the most preferred supported language', () => {
    expect(emailLanguage('nl')).toBe('nl');
    expect(emailLanguage('nl-BE,nl;q=0.9')).toBe('nl');
    expect(emailLanguage('fr;q=1,en;q=0.5,nl;q=0.8')).toBe('nl');
  });

  it('falls back to English', () => {
    expect(emailLanguage(undefined)).toBe('en');
    expect(emailLanguage('fr-FR,de;q=0.5')).toBe('en');
  });
});

describe('resetPasswordEmail', () => {
  const details = {
    name: '<b>Ada</b>',
    url: 'http://localhost/api/auth/reset-password/t?callbackURL=%2F&x=1',
    expiresInMinutes: 60,
  };

  it('puts the link in both the text and the HTML part', () => {
    const email = resetPasswordEmail('en', details);
    expect(email.text).toContain(details.url);
    expect(email.html).toContain(
      'href="http://localhost/api/auth/reset-password/t?callbackURL=%2F&amp;x=1"',
    );
    expect(email.text).toContain('expires in 60 minutes');
  });

  it('does not let the name become markup', () => {
    const { html } = resetPasswordEmail('nl', details);
    expect(html).toContain('Hoi &lt;b&gt;Ada&lt;/b&gt;,');
    expect(html).not.toContain('<b>');
  });
});
