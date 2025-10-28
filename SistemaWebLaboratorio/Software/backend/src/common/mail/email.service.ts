import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransport() {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP not configured; email sending will be skipped');
      return null;
    }
    this.transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    return this.transporter;
  }

  async send(to: string, subject: string, html: string): Promise<{ ok: boolean; messageId?: string }> {
    const t = this.getTransport();
    if (!t) { this.logger.log(`Email (mock) to ${to}: ${subject}`); return { ok: true }; }
    const from = process.env.FROM_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
    try{
      const info = await t.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to} messageId=${info.messageId}`);
      return { ok: true, messageId: info.messageId };
    }catch(e){
      this.logger.error(`Email send failed to ${to}: ${String((e as any)?.message || e)}`);
      return { ok: false };
    }
  }
}
