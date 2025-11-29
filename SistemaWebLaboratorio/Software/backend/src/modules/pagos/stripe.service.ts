import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateCheckoutSessionDto {
  codigo_cotizacion: number;
  success_url: string;
  cancel_url: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeStripe();
  }

  private initializeStripe() {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe payments disabled');
    }
  }

  /**
   * Verifica si Stripe está configurado
   */
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Crear una sesión de checkout de Stripe
   */
  async createCheckoutSession(
    data: CreateCheckoutSessionDto,
    codigo_paciente: number,
  ) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe no está configurado en el sistema');
    }

    // Obtener la cotización
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion: data.codigo_cotizacion },
      include: {
        detalles: {
          include: {
            examen: true,
          },
        },
        paciente: {
          select: {
            codigo_usuario: true,
            email: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    if (cotizacion.codigo_paciente !== codigo_paciente) {
      throw new BadRequestException('La cotización no pertenece al paciente');
    }

    if (cotizacion.estado === 'PAGADA') {
      throw new BadRequestException('Esta cotización ya fue pagada');
    }

    if (cotizacion.estado === 'EXPIRADA') {
      throw new BadRequestException('Esta cotización ha expirado');
    }

    // Verificar expiración
    if (new Date(cotizacion.fecha_expiracion) < new Date()) {
      // Actualizar estado a expirada
      await this.prisma.cotizacion.update({
        where: { codigo_cotizacion: data.codigo_cotizacion },
        data: { estado: 'EXPIRADA' },
      });
      throw new BadRequestException('La cotización ha expirado');
    }

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cotizacion.detalles.map((detalle) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: detalle.examen.nombre,
            description: detalle.examen.descripcion || `Examen de laboratorio: ${detalle.examen.codigo_interno}`,
          },
          unit_amount: Math.round(Number(detalle.precio_unitario) * 100), // Stripe usa centavos
        },
        quantity: detalle.cantidad,
      }));

    try {
      // Crear sesión de checkout
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${data.success_url}?session_id={CHECKOUT_SESSION_ID}&cotizacion=${cotizacion.numero_cotizacion}`,
        cancel_url: `${data.cancel_url}?cotizacion=${cotizacion.numero_cotizacion}`,
        customer_email: cotizacion.paciente.email,
        metadata: {
          codigo_cotizacion: cotizacion.codigo_cotizacion.toString(),
          codigo_paciente: codigo_paciente.toString(),
          numero_cotizacion: cotizacion.numero_cotizacion,
        },
        // Aplicar descuento si existe
        ...(Number(cotizacion.descuento) > 0 && {
          discounts: [{
            coupon: await this.createDiscountCoupon(Number(cotizacion.descuento)),
          }],
        }),
      });

      this.logger.log(
        `Checkout session created: ${session.id} | Cotización: ${cotizacion.numero_cotizacion}`,
      );

      // Registrar el intento de pago
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario: codigo_paciente,
          accion: 'CHECKOUT_INICIADO',
          entidad: 'Cotizacion',
          codigo_entidad: cotizacion.codigo_cotizacion,
          descripcion: `Checkout iniciado para cotización ${cotizacion.numero_cotizacion}`,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
        numero_cotizacion: cotizacion.numero_cotizacion,
      };
    } catch (error) {
      this.logger.error('Error creating Stripe checkout session', error);
      throw new BadRequestException('Error al crear la sesión de pago');
    }
  }

  /**
   * Crear un cupón de descuento temporal
   */
  private async createDiscountCoupon(amount: number): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe no configurado');
    }

    const coupon = await this.stripe.coupons.create({
      amount_off: Math.round(amount * 100), // Centavos
      currency: 'usd',
      duration: 'once',
      name: `Descuento $${amount.toFixed(2)}`,
    });

    return coupon.id;
  }

  /**
   * Procesar webhook de Stripe
   */
  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe no configurado');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret no configurado');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        this.logger.log(`Payment intent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Manejar checkout completado
   */
  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const codigoCotizacion = parseInt(session.metadata?.codigo_cotizacion || '0');
    const codigoPaciente = parseInt(session.metadata?.codigo_paciente || '0');

    if (!codigoCotizacion || !codigoPaciente) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion: codigoCotizacion },
    });

    if (!cotizacion || cotizacion.estado === 'PAGADA') {
      return; // Ya procesado o no existe
    }

    // Generar número de pago
    const numeroPago = await this.generarNumeroPago();

    // Crear pago y actualizar cotización en transacción
    await this.prisma.$transaction(async (tx) => {
      // Crear el pago
      const pago = await tx.pago.create({
        data: {
          codigo_cotizacion: codigoCotizacion,
          codigo_paciente: codigoPaciente,
          numero_pago: numeroPago,
          monto_total: cotizacion.total,
          metodo_pago: 'TARJETA_CREDITO',
          estado: 'COMPLETADO',
          proveedor_pasarela: 'STRIPE',
          id_transaccion_externa: session.payment_intent as string,
        },
      });

      // Actualizar estado de cotización
      await tx.cotizacion.update({
        where: { codigo_cotizacion: codigoCotizacion },
        data: { estado: 'PAGADA' },
      });

      // Registrar en auditoría
      await tx.logActividad.create({
        data: {
          codigo_usuario: codigoPaciente,
          accion: 'PAGO_COMPLETADO',
          entidad: 'Pago',
          codigo_entidad: pago.codigo_pago,
          descripcion: `Pago completado via Stripe: ${numeroPago} | Monto: $${cotizacion.total}`,
          datos_nuevos: {
            numero_pago: numeroPago,
            stripe_session_id: session.id,
            stripe_payment_intent: typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || null,
          },
        },
      });
    });

    this.logger.log(
      `Payment completed: ${numeroPago} | Cotización: ${cotizacion.numero_cotizacion} | Stripe Session: ${session.id}`,
    );
  }

  /**
   * Manejar pago fallido
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const codigoCotizacion = parseInt(paymentIntent.metadata?.codigo_cotizacion || '0');
    const codigoPaciente = parseInt(paymentIntent.metadata?.codigo_paciente || '0');

    if (codigoCotizacion && codigoPaciente) {
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario: codigoPaciente,
          accion: 'PAGO_FALLIDO',
          entidad: 'Cotizacion',
          codigo_entidad: codigoCotizacion,
          descripcion: `Pago fallido: ${paymentIntent.last_payment_error?.message || 'Error desconocido'}`,
        },
      });
    }

    this.logger.warn(`Payment failed: ${paymentIntent.id}`);
  }

  /**
   * Obtener estado de una sesión de checkout
   */
  async getSessionStatus(sessionId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe no configurado');
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        metadata: session.metadata,
      };
    } catch (error) {
      this.logger.error('Error retrieving session', error);
      throw new NotFoundException('Sesión de pago no encontrada');
    }
  }

  /**
   * Generar número de pago único
   */
  private async generarNumeroPago(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.pago.count({
      where: {
        numero_pago: {
          startsWith: `PAG-${year}${month}`,
        },
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `PAG-${year}${month}-${secuencial}`;
  }

  /**
   * Obtener configuración pública de Stripe
   */
  getPublicKey(): string | null {
    return this.configService.get<string>('STRIPE_PUBLIC_KEY') || null;
  }
}
