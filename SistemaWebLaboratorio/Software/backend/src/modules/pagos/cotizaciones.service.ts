import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCotizacionDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CotizacionesService {
  private readonly logger = new Logger(CotizacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener todos los exámenes agrupados por categoría
   * Para mostrar el checklist dinámico al paciente
   */
  async getExamenesParaCotizacion() {
    const categorias = await this.prisma.categoriaExamen.findMany({
      where: { activo: true },
      include: {
        examenes: {
          where: { activo: true },
          include: {
            precios: {
              where: {
                activo: true,
                AND: [
                  {
                    fecha_inicio: {
                      lte: new Date(),
                    },
                  },
                  {
                    OR: [
                      { fecha_fin: null },
                      {
                        fecha_fin: {
                          gte: new Date(),
                        },
                      },
                    ],
                  },
                ],
              },
              orderBy: {
                fecha_inicio: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Transformar para incluir precio actual y requisitos
    return categorias.map((categoria) => ({
      codigo_categoria: categoria.codigo_categoria,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      examenes: categoria.examenes.map((examen) => ({
        codigo_examen: examen.codigo_examen,
        codigo_interno: examen.codigo_interno,
        nombre: examen.nombre,
        descripcion: examen.descripcion,
        precio_actual: examen.precios[0]?.precio || 0,
        // Requisitos para el examen
        requiere_ayuno: examen.requiere_ayuno,
        horas_ayuno: examen.horas_ayuno,
        instrucciones_preparacion: examen.instrucciones_preparacion,
        tiempo_entrega_horas: examen.tiempo_entrega_horas,
        tipo_muestra: examen.tipo_muestra,
      })),
    }));
  }

  /**
   * Crear cotización con cálculo automático de precios
   */
  async createCotizacion(
    data: CreateCotizacionDto,
    codigo_paciente: number,
  ) {
    // Verificar que todos los exámenes existan y obtener precios actuales
    const examenesConPrecios = await Promise.all(
      data.examenes.map(async (item) => {
        const examen = await this.prisma.examen.findUnique({
          where: { codigo_examen: item.codigo_examen },
          include: {
            precios: {
              where: {
                activo: true,
                AND: [
                  {
                    fecha_inicio: {
                      lte: new Date(),
                    },
                  },
                  {
                    OR: [
                      { fecha_fin: null },
                      {
                        fecha_fin: {
                          gte: new Date(),
                        },
                      },
                    ],
                  },
                ],
              },
              orderBy: {
                fecha_inicio: 'desc',
              },
              take: 1,
            },
          },
        });

        if (!examen) {
          throw new NotFoundException(
            `Examen con código ${item.codigo_examen} no encontrado`,
          );
        }

        if (!examen.activo) {
          throw new BadRequestException(
            `El examen ${examen.nombre} no está disponible`,
          );
        }

        const precioActual = examen.precios[0];
        if (!precioActual) {
          throw new BadRequestException(
            `El examen ${examen.nombre} no tiene precio configurado`,
          );
        }

        return {
          codigo_examen: item.codigo_examen,
          cantidad: item.cantidad,
          precio_unitario: precioActual.precio,
          nombre_examen: examen.nombre,
        };
      }),
    );

    // Calcular subtotal
    const subtotal = examenesConPrecios.reduce((sum, item) => {
      const lineTotal = Number(item.precio_unitario) * item.cantidad;
      return sum + lineTotal;
    }, 0);

    // Aplicar descuento
    const descuento = data.descuento || 0;
    const total = subtotal - descuento;

    if (total < 0) {
      throw new BadRequestException(
        'El descuento no puede ser mayor al subtotal',
      );
    }

    // Generar número de cotización único
    const numero_cotizacion = await this.generarNumeroCotizacion();

    // Fecha de expiración (30 días)
    const fecha_expiracion = new Date();
    fecha_expiracion.setDate(fecha_expiracion.getDate() + 30);

    // Crear cotización con detalles en transacción
    const cotizacion = await this.prisma.$transaction(async (tx) => {
      const nuevaCotizacion = await tx.cotizacion.create({
        data: {
          codigo_paciente,
          numero_cotizacion,
          fecha_expiracion,
          subtotal: new Decimal(subtotal.toFixed(2)),
          descuento: new Decimal(descuento.toFixed(2)),
          total: new Decimal(total.toFixed(2)),
          estado: 'PENDIENTE',
          observaciones: data.observaciones,
          detalles: {
            create: examenesConPrecios.map((item) => ({
              codigo_examen: item.codigo_examen,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              total_linea: new Decimal(
                (Number(item.precio_unitario) * item.cantidad).toFixed(2),
              ),
            })),
          },
        },
        include: {
          detalles: {
            include: {
              examen: {
                select: {
                  codigo_examen: true,
                  codigo_interno: true,
                  nombre: true,
                  requiere_ayuno: true,
                  horas_ayuno: true,
                  instrucciones_preparacion: true,
                  tiempo_entrega_horas: true,
                  tipo_muestra: true,
                },
              },
            },
          },
          paciente: {
            select: {
              codigo_usuario: true,
              nombres: true,
              apellidos: true,
              email: true,
              cedula: true,
            },
          },
        },
      });

      return nuevaCotizacion;
    });

    this.logger.log(
      `Cotización creada: ${numero_cotizacion} | Paciente: ${codigo_paciente} | Total: $${total}`,
    );

    return cotizacion;
  }

  /**
   * Obtener cotizaciones del paciente autenticado
   */
  async getMyCotizaciones(codigo_paciente: number) {
    const cotizaciones = await this.prisma.cotizacion.findMany({
      where: {
        codigo_paciente,
      },
      include: {
        detalles: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
                codigo_interno: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_cotizacion: 'desc',
      },
    });

    return cotizaciones;
  }

  /**
   * Obtener una cotización específica (con verificación de propiedad)
   */
  async getCotizacion(codigo_cotizacion: number, codigo_paciente: number) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion },
      include: {
        detalles: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                codigo_interno: true,
                nombre: true,
                descripcion: true,
                requiere_ayuno: true,
                horas_ayuno: true,
                instrucciones_preparacion: true,
                tiempo_entrega_horas: true,
                tipo_muestra: true,
              },
            },
          },
        },
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            email: true,
            cedula: true,
            telefono: true,
          },
        },
      },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    // Verificar que pertenece al paciente
    if (cotizacion.codigo_paciente !== codigo_paciente) {
      throw new NotFoundException('Cotización no encontrada');
    }

    return cotizacion;
  }

  /**
   * Obtener todas las cotizaciones (Admin)
   */
  async getAllCotizaciones(filters?: {
    codigo_paciente?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.codigo_paciente) {
      where.codigo_paciente = filters.codigo_paciente;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_cotizacion = {};

      if (filters.fecha_desde) {
        where.fecha_cotizacion.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_cotizacion.lte = new Date(filters.fecha_hasta);
      }
    }

    const cotizaciones = await this.prisma.cotizacion.findMany({
      where,
      include: {
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            cedula: true,
            email: true,
          },
        },
        detalles: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
                codigo_interno: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_cotizacion: 'desc',
      },
    });

    return cotizaciones;
  }

  /**
   * Actualizar estado de cotización (Admin)
   */
  async updateCotizacion(
    codigo_cotizacion: number,
    estado: string,
    observaciones?: string,
  ) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const updated = await this.prisma.cotizacion.update({
      where: { codigo_cotizacion },
      data: {
        estado,
        observaciones: observaciones || cotizacion.observaciones,
      },
      include: {
        paciente: {
          select: {
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        detalles: {
          include: {
            examen: true,
          },
        },
      },
    });

    this.logger.log(
      `Cotización actualizada: ${cotizacion.numero_cotizacion} | Nuevo estado: ${estado}`,
    );

    return updated;
  }

  /**
   * Obtener estadísticas de cotizaciones (Admin)
   */
  async getEstadisticas(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_cotizacion = {};

      if (filters.fecha_desde) {
        where.fecha_cotizacion.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_cotizacion.lte = new Date(filters.fecha_hasta);
      }
    }

    const [total, pendientes, aceptadas, rechazadas, pagadas, expiradas] =
      await Promise.all([
        this.prisma.cotizacion.count({ where }),
        this.prisma.cotizacion.count({
          where: { ...where, estado: 'PENDIENTE' },
        }),
        this.prisma.cotizacion.count({
          where: { ...where, estado: 'ACEPTADA' },
        }),
        this.prisma.cotizacion.count({
          where: { ...where, estado: 'RECHAZADA' },
        }),
        this.prisma.cotizacion.count({ where: { ...where, estado: 'PAGADA' } }),
        this.prisma.cotizacion.count({
          where: { ...where, estado: 'EXPIRADA' },
        }),
      ]);

    // Calcular total de ventas de cotizaciones pagadas
    const totalVentas = await this.prisma.cotizacion.aggregate({
      where: { ...where, estado: 'PAGADA' },
      _sum: {
        total: true,
      },
    });

    return {
      total,
      pendientes,
      aceptadas,
      rechazadas,
      pagadas,
      expiradas,
      total_ventas: totalVentas._sum.total || 0,
    };
  }

  /**
   * Generar número de cotización único
   */
  private async generarNumeroCotizacion(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Contar cotizaciones del mes actual
    const count = await this.prisma.cotizacion.count({
      where: {
        numero_cotizacion: {
          startsWith: `COT-${year}${month}`,
        },
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `COT-${year}${month}-${secuencial}`;
  }
}
