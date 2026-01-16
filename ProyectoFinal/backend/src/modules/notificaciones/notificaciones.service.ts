import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificacionesService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
    this.fromEmail = this.configService.get('EMAIL_FROM') || '"SportCenter" <noreply@sportcenter.com>';
  }

  private getEmailTemplate(content: string, title: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f1f5f9; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 8px 0 0; opacity: 0.9; }
          .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
          .detail-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; }
          .detail-value { font-weight: 600; color: #1e293b; }
          .total-box { background: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px; }
          .badge { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
          .badge-pending { background: #f59e0b; }
          h2 { color: #1e293b; margin-top: 0; }
          a.button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SportCenter</h1>
            <p>${title}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0;">SportCenter - Tu destino deportivo favorito</p>
            <p style="margin: 8px 0 0;">Este es un correo automatico, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async enviarConfirmacionPago(email: string, data: {
    nombre: string;
    cancha: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    monto: number;
    metodo: string;
    referencia: string;
  }) {
    const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge">Pago Exitoso</span>
      </div>
      <h2>Hola ${data.nombre}!</h2>
      <p>Tu pago ha sido procesado correctamente. Aqui estan los detalles de tu reserva:</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Codigo de Reserva</span>
          <span class="detail-value">${data.referencia}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancha</span>
          <span class="detail-value">${data.cancha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${data.fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Horario</span>
          <span class="detail-value">${data.horaInicio} - ${data.horaFin}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Metodo de Pago</span>
          <span class="detail-value">${data.metodo}</span>
        </div>
      </div>

      <div class="total-box">
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Total Pagado</p>
        <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold;">$${data.monto.toFixed(2)}</p>
      </div>

      <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
        Recuerda llegar 10 minutos antes de tu horario reservado. Si necesitas cancelar tu reserva, hazlo con al menos 24 horas de anticipacion.
      </p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: `Confirmacion de Pago - Reserva ${data.referencia}`,
        html: this.getEmailTemplate(content, 'Confirmacion de Pago'),
      });
      console.log('Email de confirmacion de pago enviado a:', email);
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email de pago:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }

  async enviarConfirmacionRegistro(email: string, nombre: string) {
    const content = `
      <h2>Bienvenido ${nombre}!</h2>
      <p>Tu cuenta ha sido creada exitosamente en SportCenter.</p>
      <p>Ya puedes explorar nuestras canchas y hacer reservas de:</p>
      <ul>
        <li>Futbol</li>
        <li>Tenis</li>
        <li>Basquet</li>
      </ul>
      <p>Inicia sesion y reserva tu cancha favorita ahora mismo.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Bienvenido a SportCenter',
        html: this.getEmailTemplate(content, 'Bienvenido'),
      });
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }

  async enviarConfirmacionReserva(email: string, reserva: any) {
    const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-pending">Reserva Pendiente de Pago</span>
      </div>
      <h2>Hola ${reserva.nombre}!</h2>
      <p>Tu reserva ha sido registrada. Recuerda completar el pago para confirmarla.</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Cancha</span>
          <span class="detail-value">${reserva.cancha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${reserva.fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Horario</span>
          <span class="detail-value">${reserva.horaInicio} - ${reserva.horaFin}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Monto a Pagar</span>
          <span class="detail-value">$${reserva.monto}</span>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Reserva Registrada - SportCenter',
        html: this.getEmailTemplate(content, 'Reserva Registrada'),
      });
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }

  async enviarRecordatorio(email: string, reserva: any) {
    const content = `
      <h2>Recordatorio de Reserva</h2>
      <p>Te recordamos que tienes una reserva para manana:</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Cancha</span>
          <span class="detail-value">${reserva.cancha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${reserva.fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Horario</span>
          <span class="detail-value">${reserva.horaInicio} - ${reserva.horaFin}</span>
        </div>
      </div>

      <p>Te esperamos!</p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Recordatorio: Reserva Manana - SportCenter',
        html: this.getEmailTemplate(content, 'Recordatorio'),
      });
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }
}
