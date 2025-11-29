import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ComunicacionesService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(ComunicacionesService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('SMTP Transporter initialized');
    } else {
      this.logger.warn(
        'SMTP credentials not found. Email sending will be disabled or logged only.',
      );
    }
  }

  async sendWelcomeEmail(user: { email: string; nombres: string }) {
    if (!this.transporter) {
      this.logger.warn(`[MOCK EMAIL] Welcome email to ${user.email}`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0070f3;">Laboratorio Clínico Franz</h1>
        </div>
        <h2 style="color: #333;">¡Bienvenido, ${user.nombres}!</h2>
        <p style="color: #555; line-height: 1.6;">
          Gracias por registrarte en nuestro portal de pacientes. Ahora podrás agendar citas, ver tus resultados y gestionar tus cotizaciones en línea.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/login" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Iniciar Sesión
          </a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          Si no creaste esta cuenta, por favor ignora este correo.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"Laboratorio Franz" <' + this.configService.get('SMTP_USER') + '>',
        to: user.email,
        subject: 'Bienvenido a Laboratorio Franz',
        html,
      });
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${user.email}`, error);
    }
  }

  async sendPasswordRecoveryEmail(user: { email: string; nombres: string }, token: string) {
    if (!this.transporter) {
      this.logger.warn(`[MOCK EMAIL] Recovery email to ${user.email} with token ${token}`);
      return;
    }

    const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0070f3;">Laboratorio Clínico Franz</h1>
        </div>
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p style="color: #555; line-height: 1.6;">
          Hola ${user.nombres}, hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        <p style="color: #555; line-height: 1.6;">
          O copia y pega el siguiente enlace en tu navegador:
        </p>
        <p style="color: #0070f3; word-break: break-all;">${resetLink}</p>
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          Este enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"Laboratorio Franz" <' + this.configService.get('SMTP_USER') + '>',
        to: user.email,
        subject: 'Recuperación de Contraseña - Laboratorio Franz',
        html,
      });
      this.logger.log(`Recovery email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending recovery email to ${user.email}`, error);
    }
  }
}
