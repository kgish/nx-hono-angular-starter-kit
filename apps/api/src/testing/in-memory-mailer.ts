import type { Email, Mailer } from '../mailer';

/** Keeps sent emails in `sent` instead of delivering them. */
export class InMemoryMailer implements Mailer {
  readonly sent: Email[] = [];

  async send(email: Email) {
    this.sent.push(email);
  }
}
