import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificacionesService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async enviarConfirmacionRegistro(email: string, nombre: string) {
    const mailOptions = {
      from: '"Centro Deportivo" <noreply@centrodeportivo.com>',
      to: email,
      subject: 'Bienvenido al Centro Deportivo',
      html: `
        <h1>¡Bienvenido ${nombre}!</h1>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Ya puedes reservar canchas deportivas en nuestro sistema.</p>
        <br>
        <p>Saludos,<br>Centro Deportivo</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }

  async enviarConfirmacionReserva(email: string, reserva: any) {
    const mailOptions = {
      from: '"Centro Deportivo" <noreply@centrodeportivo.com>',
      to: email,
      subject: 'Confirmación de Reserva',
      html: `
        <h1>¡Reserva Confirmada!</h1>
        <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
        <ul>
          <li><strong>Cancha:</strong> ${reserva.cancha}</li>
          <li><strong>Fecha:</strong> ${reserva.fecha}</li>
          <li><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</li>
          <li><strong>Monto pagado:</strong> Bs. ${reserva.monto}</li>
          <li><strong>Referencia:</strong> ${reserva.referencia}</li>
        </ul>
        <br>
        <p>¡Te esperamos!</p>
        <p>Centro Deportivo</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }

  async enviarRecordatorio(email: string, reserva: any) {
    const mailOptions = {
      from: '"Centro Deportivo" <noreply@centrodeportivo.com>',
      to: email,
      subject: 'Recordatorio de Reserva - Mañana',
      html: `
        <h1>Recordatorio de Reserva</h1>
        <p>Te recordamos que tienes una reserva para mañana:</p>
        <ul>
          <li><strong>Cancha:</strong> ${reserva.cancha}</li>
          <li><strong>Fecha:</strong> ${reserva.fecha}</li>
          <li><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</li>
        </ul>
        <br>
        <p>¡Te esperamos!</p>
        <p>Centro Deportivo</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email enviado' };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, message: 'Error enviando email' };
    }
  }
}
