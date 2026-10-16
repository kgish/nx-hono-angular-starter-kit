import type { Email } from './mailer';

/** The UI languages; the web app sends the active one as `Accept-Language`. */
export type EmailLanguage = 'en' | 'nl';

const LANGUAGES: readonly EmailLanguage[] = ['en', 'nl'];

/** The preferred supported language in an `Accept-Language` header, else English. */
export function emailLanguage(
  header: string | null | undefined,
): EmailLanguage {
  const preferred = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.find((param) => param.trim().startsWith('q='));
      return {
        language: tag.split('-')[0].toLowerCase(),
        weight: q ? Number(q.trim().slice(2)) : 1,
      };
    })
    .sort((a, b) => b.weight - a.weight);
  const match = preferred.find(({ language }) =>
    LANGUAGES.includes(language as EmailLanguage),
  );
  return (match?.language as EmailLanguage | undefined) ?? 'en';
}

interface ResetPasswordDetails {
  name: string;
  url: string;
  expiresInMinutes: number;
}

const resetPasswordCopy: Record<
  EmailLanguage,
  (details: ResetPasswordDetails) => {
    subject: string;
    greeting: string;
    body: string;
    action: string;
    footer: string;
  }
> = {
  en: ({ name, expiresInMinutes }) => ({
    subject: 'Reset your Todos password',
    greeting: `Hi ${name},`,
    body: 'We received a request to reset the password of your Todos account. Use the link below to choose a new one.',
    action: 'Choose a new password',
    footer: `The link works once and expires in ${expiresInMinutes} minutes. If you didn't ask for this, you can ignore this email; your password stays the same.`,
  }),
  nl: ({ name, expiresInMinutes }) => ({
    subject: 'Stel je wachtwoord voor Taken opnieuw in',
    greeting: `Hoi ${name},`,
    body: 'We kregen een verzoek om het wachtwoord van je Taken-account opnieuw in te stellen. Via de link hieronder kies je een nieuw wachtwoord.',
    action: 'Kies een nieuw wachtwoord',
    footer: `De link werkt één keer en verloopt over ${expiresInMinutes} minuten. Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft hetzelfde.`,
  }),
};

export function resetPasswordEmail(
  language: EmailLanguage,
  details: ResetPasswordDetails,
): Omit<Email, 'to'> {
  const copy = resetPasswordCopy[language](details);
  const html = (value: string) => escapeHtml(value);
  return {
    subject: copy.subject,
    text: [copy.greeting, copy.body, details.url, copy.footer].join('\n\n'),
    html: [
      `<p>${html(copy.greeting)}</p>`,
      `<p>${html(copy.body)}</p>`,
      `<p><a href="${html(details.url)}">${html(copy.action)}</a></p>`,
      `<p>${html(copy.footer)}</p>`,
    ].join('\n'),
  };
}

/** User input (such as the name) must not become markup in the email. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
