import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPaymentConfirmation(to: string, data: {
    nombre: string;
    cancha: string;
    fecha: string;
    hora: string;
    monto: number;
    metodo: string;
    codigoReserva: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { color: #64748b; }
          .detail-value { font-weight: 600; color: #1e293b; }
          .total { background: #2563eb; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; }
          .badge { background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          h1 { margin: 0; font-size: 24px; }
          h2 { color: #1e293b; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SportCenter</h1>
            <p style="margin: 10px 0 0;">Confirmacion de Pago</p>
          </div>
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge">Pago Exitoso</span>
            </div>
            <h2>Hola ${data.nombre}!</h2>
            <p>Tu pago ha sido procesado correctamente. Aqui estan los detalles de tu reserva:</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div class="detail-row">
                <span class="detail-label">Codigo de Reserva</span>
                <span class="detail-value">${data.codigoReserva}</span>
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
                <span class="detail-value">${data.hora}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Metodo de Pago</span>
                <span class="detail-value">${data.metodo}</span>
              </div>
            </div>

            <div class="total">
              <p style="margin: 0; font-size: 14px;">Total Pagado</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold;">$${data.monto.toFixed(2)}</p>
            </div>

            <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
              Recuerda llegar 10 minutos antes de tu horario reservado. Si necesitas cancelar o modificar tu reserva, hazlo con al menos 24 horas de anticipacion.
            </p>
          </div>
          <div class="footer">
            <p>SportCenter - Tu destino deportivo favorito</p>
            <p>Este es un correo automatico, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SportCenter" <noreply@sportcenter.com>',
        to,
        subject: `Confirmacion de Pago - Reserva ${data.codigoReserva}`,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendReservationConfirmation(to: string, data: {
    nombre: string;
    cancha: string;
    fecha: string;
    hora: string;
    codigoReserva: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          h1 { margin: 0; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SportCenter</h1>
            <p style="margin: 10px 0 0;">Reserva Confirmada</p>
          </div>
          <div class="content">
            <h2>Hola ${data.nombre}!</h2>
            <p>Tu reserva ha sido confirmada por el administrador.</p>
            <ul>
              <li><strong>Codigo:</strong> ${data.codigoReserva}</li>
              <li><strong>Cancha:</strong> ${data.cancha}</li>
              <li><strong>Fecha:</strong> ${data.fecha}</li>
              <li><strong>Hora:</strong> ${data.hora}</li>
            </ul>
            <p>Te esperamos!</p>
          </div>
          <div class="footer">
            <p>SportCenter - Tu destino deportivo favorito</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SportCenter" <noreply@sportcenter.com>',
        to,
        subject: `Reserva Confirmada - ${data.codigoReserva}`,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
