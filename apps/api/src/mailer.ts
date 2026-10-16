import { createTransport } from 'nodemailer';

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(email: Email): Promise<void>;
}

/**
 * Sends through an SMTP server given as a URL: `smtp://localhost:1025` for
 * Mailpit, or `smtps://user:password@smtp.example.com:465` for a provider.
 */
export function createSmtpMailer(url: string, from: string): Mailer {
  const transport = createTransport(url);
  return {
    async send(email) {
      await transport.sendMail({ from, ...email });
    },
  };
}
