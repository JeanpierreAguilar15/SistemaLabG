import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPasswordReset(to: string, link: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    let transporter: nodemailer.Transporter;
    let previewUrl: string | undefined;
    let usedFallback = false;

    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: false,
        auth: { user, pass },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@sistemalab.local',
        to,
        subject: 'Recuperación de contraseña',
        html: `
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace o cópialo en tu navegador:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        `,
      });
      if (nodemailer.getTestMessageUrl(info)) {
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        this.logger.log(`Vista previa correo: ${previewUrl}`);
      }
    } catch (err) {
      // Fallback automático a cuenta de prueba si SMTP falla (útil en dev)
      this.logger.warn(`Fallo SMTP, usando cuenta de prueba: ${String(err)}`);
      const testAccount = await nodemailer.createTestAccount();
      const fallback = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await fallback.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@sistemalab.local',
        to,
        subject: 'Recuperación de contraseña',
        html: `
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace o cópialo en tu navegador:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        `,
      });
      previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      usedFallback = true;
      this.logger.log(`Vista previa (fallback) correo: ${previewUrl}`);
    }

    return { previewUrl, usedFallback };
  }
}
