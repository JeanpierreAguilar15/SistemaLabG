import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { WhatsAppService } from '../comunicaciones/whatsapp.service';
import { InventarioService } from '../inventario/inventario.service';
import { AdminEventsService } from '../admin/admin-events.service';
import { CreateResultadoDto, UpdateResultadoDto, CreateMuestraDto } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ResultadosService {
  private readonly logger = new Logger(ResultadosService.name);
  private readonly estadosResultadoDisponibles = ['LISTO', 'VALIDADO', 'ENTREGADO'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly whatsappService: WhatsAppService,
    @Inject(forwardRef(() => InventarioService))
    private readonly inventarioService: InventarioService,
    @Inject(forwardRef(() => AdminEventsService))
    private readonly adminEventsService: AdminEventsService,
  ) {}

  // ==================== MUESTRAS ====================

  /**
   * Crear nueva muestra (Admin/Técnico)
   */
  async createMuestra(data: CreateMuestraDto, tomada_por: number) {
    // Verificar que el ID de muestra sea único
    const existe = await this.prisma.muestra.findUnique({
      where: { id_muestra: data.id_muestra },
    });

    if (existe) {
      throw new BadRequestException(
        `Ya existe una muestra con ID ${data.id_muestra}`,
      );
    }

    // Verificar que el paciente existe
    const paciente = await this.prisma.usuario.findUnique({
      where: { codigo_usuario: data.codigo_paciente },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const muestra = await this.prisma.muestra.create({
      data: {
        codigo_paciente: data.codigo_paciente,
        id_muestra: data.id_muestra,
        tipo_muestra: data.tipo_muestra,
        fecha_toma: data.fecha_toma ? new Date(data.fecha_toma) : new Date(),
        observaciones: data.observaciones,
        tomada_por,
        estado: 'RECOLECTADA',
      },
      include: {
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            cedula: true,
          },
        },
      },
    });

    this.logger.log(
      `Muestra creada: ${muestra.id_muestra} | Paciente: ${data.codigo_paciente} | Tomada por: ${tomada_por}`,
    );

    return muestra;
  }

  /**
   * Obtener muestras con filtros (Admin/Técnico)
   */
  async getMuestras(filters?: {
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
      where.fecha_toma = {};

      if (filters.fecha_desde) {
        where.fecha_toma.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_toma.lte = new Date(filters.fecha_hasta);
      }
    }

    const muestras = await this.prisma.muestra.findMany({
      where,
      include: {
        paciente: {
          select: {
            codigo_usuario: true,
            nombres: true,
            apellidos: true,
            cedula: true,
          },
        },
        resultados: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_toma: 'desc',
      },
    });

    return muestras;
  }

  // ==================== RESULTADOS ====================

  /**
   * Crear resultado para una muestra (Admin/Técnico)
   */
  async createResultado(data: CreateResultadoDto, procesado_por: number) {
    // Verificar que la muestra existe
    const muestra = await this.prisma.muestra.findUnique({
      where: { codigo_muestra: data.codigo_muestra },
      include: {
        paciente: true,
      },
    });

    if (!muestra) {
      throw new NotFoundException('Muestra no encontrada');
    }

    // Verificar que el examen existe
    const examen = await this.prisma.examen.findUnique({
      where: { codigo_examen: data.codigo_examen },
    });

    if (!examen) {
      throw new NotFoundException('Examen no encontrado');
    }

    // Calcular si está dentro del rango normal
    if (!examen.activo) {
      throw new BadRequestException('No se puede crear resultado para un examen inactivo');
    }

    const resultadoExistente = await this.prisma.resultado.findFirst({
      where: {
        codigo_muestra: data.codigo_muestra,
        codigo_examen: data.codigo_examen,
      },
    });

    if (resultadoExistente) {
      throw new BadRequestException('Ya existe un resultado para este examen en la muestra seleccionada');
    }

    let dentro_rango_normal: boolean | null = null;
    let nivel: string | null = null;

    if (
      data.valor_numerico !== undefined &&
      data.valor_referencia_min !== undefined &&
      data.valor_referencia_max !== undefined
    ) {
      const valor = Number(data.valor_numerico);
      const min = Number(data.valor_referencia_min);
      const max = Number(data.valor_referencia_max);

      dentro_rango_normal = valor >= min && valor <= max;

      if (valor < min) {
        nivel = 'BAJO';
      } else if (valor > max) {
        nivel = 'ALTO';
      } else {
        nivel = 'NORMAL';
      }

      // Si está muy fuera del rango, marcar como crítico
      if (valor < min * 0.5 || valor > max * 1.5) {
        nivel = 'CRITICO';
      }
    }

    const resultado = await this.prisma.resultado.create({
      data: {
        codigo_muestra: data.codigo_muestra,
        codigo_examen: data.codigo_examen,
        valor_numerico: data.valor_numerico,
        valor_texto: data.valor_texto,
        unidad_medida: data.unidad_medida,
        valor_referencia_min: data.valor_referencia_min,
        valor_referencia_max: data.valor_referencia_max,
        valores_referencia_texto: data.valores_referencia_texto,
        observaciones_tecnicas: data.observaciones_tecnicas,
        dentro_rango_normal,
        nivel,
        procesado_por,
        estado: 'EN_PROCESO',
      },
      include: {
        muestra: {
          include: {
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
        examen: true,
      },
    });

    this.logger.log(
      `Resultado creado: ${resultado.codigo_resultado} | Muestra: ${data.codigo_muestra} | Procesado por: ${procesado_por}`,
    );

    return resultado;
  }

  /**
   * Validar resultado y generar PDF (Admin/Técnico)
   */
  async validarResultado(codigo_resultado: number, validado_por: number) {
    const resultado = await this.prisma.resultado.findUnique({
      where: { codigo_resultado },
      include: {
        muestra: {
          include: {
            paciente: true,
          },
        },
        examen: true,
      },
    });

    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado');
    }

    // Generar código de verificación único
    const yaEstabaDisponible = this.estadosResultadoDisponibles.includes(resultado.estado);
    const codigo_verificacion = this.generarCodigoVerificacion();

    // Generar PDF
    let url_pdf: string | null = null;
    try {
      const pdfPath = await this.pdfGenerator.generateResultadoPdf({
        resultado,
        paciente: resultado.muestra.paciente,
        examen: resultado.examen,
        codigo_verificacion,
      });

      // Convertir path absoluto a URL relativa
      url_pdf = `/uploads/resultados/${pdfPath.split('/').pop()}`;
    } catch (error) {
      this.logger.error(
        `Error generando PDF para resultado ${codigo_resultado}: ${error.message}`,
      );
      // Continuar sin PDF si falla
    }

    // Actualizar resultado
    const resultadoValidado = await this.prisma.resultado.update({
      where: { codigo_resultado },
      data: {
        estado: 'LISTO',
        validado_por,
        fecha_validacion: new Date(),
        codigo_verificacion,
        url_pdf,
      },
      include: {
        muestra: {
          include: {
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
          },
        },
        examen: {
          select: {
            nombre: true,
          },
        },
      },
    });

    this.logger.log(
      `Resultado validado: ${codigo_resultado} | Validado por: ${validado_por}`,
    );

    this.adminEventsService.emitResultadoValidated(codigo_resultado, validado_por, {
      paciente: `${resultadoValidado.muestra.paciente.nombres} ${resultadoValidado.muestra.paciente.apellidos}`,
      examen: resultadoValidado.examen.nombre,
      codigo_examen: resultado.codigo_examen,
    });

    if (!yaEstabaDisponible) {
      // Descontar insumos del inventario usando el servicio completo
      // (FIFO de lotes, manejo de reactivos con frascos, alertas de stock)
      await this.descontarInsumosAutomatico(
        resultado.codigo_examen,
        codigo_resultado,
        validado_por,
      );

      try {
        await this.enviarNotificacionWhatsApp(
          resultado.muestra.codigo_paciente,
          resultado.muestra.paciente.telefono,
          resultado.muestra.paciente.nombres,
          resultado.examen.nombre,
          codigo_verificacion,
        );
      } catch (error) {
        this.logger.warn(
          `Error enviando WhatsApp para resultado ${codigo_resultado}: ${error.message}`,
        );
      }
    } else {
      this.logger.log(
        `Resultado ${codigo_resultado} ya estaba disponible; no se descuentan insumos ni se reenvia WhatsApp.`,
      );
    }

    return resultadoValidado;
  }

  /**
   * Subir PDF de resultado manualmente (para resultados procesados externamente)
   */
  async uploadPdfManually(
    codigo_resultado: number,
    filename: string,
    validado_por: number,
  ) {
    // Verificar que el resultado existe
    const resultado = await this.prisma.resultado.findUnique({
      where: { codigo_resultado },
      include: {
        muestra: {
          include: {
            paciente: true,
          },
        },
        examen: true,
      },
    });

    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado');
    }

    // Generar código de verificación si no existe
    let codigo_verificacion = resultado.codigo_verificacion;
    if (!codigo_verificacion) {
      codigo_verificacion = this.generarCodigoVerificacion();
    }

    // Construir URL relativa del PDF
    const url_pdf = `/uploads/resultados/${filename}`;

    const estadoAnterior = resultado.estado;

    // Actualizar resultado con el PDF subido y marcarlo como validado
    const resultadoActualizado = await this.prisma.resultado.update({
      where: { codigo_resultado },
      data: {
        estado: 'LISTO',
        validado_por,
        fecha_validacion: new Date(),
        codigo_verificacion,
        url_pdf,
      },
      include: {
        muestra: {
          include: {
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
          },
        },
        examen: true,
      },
    });

    this.logger.log(
      `PDF subido manualmente para resultado ${codigo_resultado} por usuario ${validado_por}`,
    );

    this.adminEventsService.emitResultadoPdfUploaded(codigo_resultado, validado_por, {
      examen: resultado.examen.nombre,
      codigo_examen: resultado.codigo_examen,
    });

    // Solo descontar y notificar si el resultado NO estaba ya validado
    const yaEstabValidado = this.estadosResultadoDisponibles.includes(estadoAnterior);
    if (!yaEstabValidado) {
      await this.descontarInsumosAutomatico(
        resultado.codigo_examen,
        codigo_resultado,
        validado_por,
      );

      try {
        await this.enviarNotificacionWhatsApp(
          resultado.muestra.codigo_paciente,
          resultado.muestra.paciente.telefono,
          resultado.muestra.paciente.nombres,
          resultado.examen.nombre,
          codigo_verificacion,
        );
      } catch (error) {
        this.logger.warn(
          `Error enviando WhatsApp para resultado ${codigo_resultado}: ${error.message}`,
        );
      }
    }

    return resultadoActualizado;
  }

  /**
   * Obtener resultados del paciente autenticado
   */
  async getMyDashboardStats(codigo_paciente: number) {
    const [resultadosListos, resultadosEnProceso] = await Promise.all([
      this.prisma.resultado.count({
        where: {
          muestra: { codigo_paciente },
          estado: { in: this.estadosResultadoDisponibles },
        },
      }),
      this.prisma.resultado.count({
        where: {
          muestra: { codigo_paciente },
          estado: 'EN_PROCESO',
        },
      }),
    ]);

    return {
      stats: {
        resultadosListos,
        resultadosEnProceso,
      },
    };
  }

  async getMyResultados(codigo_paciente: number) {
    const resultados = await this.prisma.resultado.findMany({
      where: {
        muestra: {
          codigo_paciente,
        },
        estado: {
          in: this.estadosResultadoDisponibles,
        },
      },
      include: {
        examen: {
          select: {
            codigo_examen: true,
            nombre: true,
            codigo_interno: true,
          },
        },
        muestra: {
          select: {
            codigo_muestra: true,
            id_muestra: true,
            fecha_toma: true,
            tipo_muestra: true,
          },
        },
      },
      orderBy: {
        fecha_resultado: 'desc',
      },
    });

    return resultados;
  }

  /**
   * Obtener resultados del paciente agrupados por muestra.
   * Todos los exámenes asociados a una muestra se muestran juntos.
   */
  async getMyResultadosAgrupados(codigo_paciente: number) {
    // Obtener muestras con sus resultados
    const muestras = await this.prisma.muestra.findMany({
      where: {
        codigo_paciente,
        resultados: {
          some: {
            estado: {
              in: this.estadosResultadoDisponibles,
            },
          },
        },
      },
      include: {
        resultados: {
          where: {
            estado: {
              in: this.estadosResultadoDisponibles,
            },
          },
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
                codigo_interno: true,
                unidad_medida: true,
              },
            },
          },
          orderBy: {
            examen: {
              nombre: 'asc',
            },
          },
        },
      },
      orderBy: {
        fecha_toma: 'desc',
      },
    });

    // Formatear la respuesta agrupada
    return muestras.map((muestra) => ({
      codigo_muestra: muestra.codigo_muestra,
      id_muestra: muestra.id_muestra,
      fecha_toma: muestra.fecha_toma,
      tipo_muestra: muestra.tipo_muestra,
      estado_muestra: muestra.estado,
      estado: muestra.estado,
      resultados: muestra.resultados.map((r) => ({
        codigo_resultado: r.codigo_resultado,
        examen: {
          codigo_examen: r.examen.codigo_examen,
          nombre: r.examen.nombre,
          codigo_interno: r.examen.codigo_interno,
        },
        nombre_examen: r.examen.nombre,
        codigo_examen: r.examen.codigo_examen,
        valor_numerico: r.valor_numerico,
        valor_texto: r.valor_texto,
        unidad_medida: r.unidad_medida || r.examen.unidad_medida,
        valor_referencia_min: r.valor_referencia_min,
        valor_referencia_max: r.valor_referencia_max,
        valores_referencia_texto: r.valores_referencia_texto,
        dentro_rango_normal: r.dentro_rango_normal,
        nivel: r.nivel,
        estado: r.estado,
        fecha_resultado: r.fecha_resultado,
        url_pdf: r.url_pdf,
        codigo_verificacion: r.codigo_verificacion,
      })),
      total_examenes: muestra.resultados.length,
      examenes_listos: muestra.resultados.filter((r) =>
        this.estadosResultadoDisponibles.includes(r.estado),
      ).length,
      examenes_pendientes: muestra.resultados.filter(
        (r) => !this.estadosResultadoDisponibles.includes(r.estado),
      ).length,
      todos_listos: muestra.resultados.every((r) =>
        this.estadosResultadoDisponibles.includes(r.estado),
      ),
    }));
  }

  /**
   * Descargar PDF de resultado (Paciente)
   */
  async downloadResultado(codigo_resultado: number, codigo_paciente: number) {
    const resultado = await this.prisma.resultado.findUnique({
      where: { codigo_resultado },
      include: {
        muestra: true,
      },
    });

    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado');
    }

    // Verificar que el resultado pertenece al paciente
    if (resultado.muestra.codigo_paciente !== codigo_paciente) {
      throw new NotFoundException('Resultado no encontrado');
    }

    // Verificar que el resultado está listo
    if (!this.estadosResultadoDisponibles.includes(resultado.estado)) {
      throw new BadRequestException('El resultado aún no está disponible');
    }

    if (!resultado.url_pdf) {
      throw new NotFoundException('PDF no disponible');
    }

    // Registrar descarga
    await this.prisma.descargaResultado.create({
      data: {
        codigo_resultado,
        codigo_usuario: codigo_paciente,
        fecha_descarga: new Date(),
      },
    });

    // Actualizar estado a ENTREGADO automáticamente al descargar
    // Solo si no está ya entregado (LISTO o VALIDADO → ENTREGADO)
    if (resultado.estado !== 'ENTREGADO') {
      await this.prisma.resultado.update({
        where: { codigo_resultado },
        data: { estado: 'ENTREGADO' },
      });

      this.logger.log(
        `Estado actualizado a ENTREGADO automáticamente | Resultado: ${codigo_resultado}`,
      );
    }

    this.logger.log(
      `Resultado descargado: ${codigo_resultado} | Paciente: ${codigo_paciente}`,
    );

    return resultado.url_pdf;
  }

  /**
   * Obtener todos los resultados (Admin)
   */
  async getAllResultados(filters?: {
    codigo_resultado?: number;
    codigo_paciente?: number;
    codigo_examen?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.codigo_resultado) {
      where.codigo_resultado = filters.codigo_resultado;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.codigo_examen) {
      where.codigo_examen = filters.codigo_examen;
    }

    if (filters?.codigo_paciente) {
      where.muestra = {
        codigo_paciente: filters.codigo_paciente,
      };
    }

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_resultado = {};

      if (filters.fecha_desde) {
        where.fecha_resultado.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_resultado.lte = new Date(filters.fecha_hasta);
      }
    }

    const resultados = await this.prisma.resultado.findMany({
      where,
      include: {
        examen: {
          select: {
            codigo_examen: true,
            nombre: true,
            codigo_interno: true,
          },
        },
        muestra: {
          select: {
            codigo_muestra: true,
            id_muestra: true,
            tipo_muestra: true,
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
                cedula: true,
              },
            },
          },
        },
        procesador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        validador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
      orderBy: {
        fecha_resultado: 'desc',
      },
    });

    return resultados;
  }

  /**
   * Actualizar estado de resultado (Admin)
   */
  async updateResultado(
    codigo_resultado: number,
    data: UpdateResultadoDto,
    adminId: number,
  ) {
    const resultado = await this.prisma.resultado.findUnique({
      where: { codigo_resultado },
      include: {
        muestra: {
          include: {
            paciente: true,
          },
        },
        examen: true,
      },
    });

    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado');
    }

    const updated = await this.prisma.resultado.update({
      where: { codigo_resultado },
      data: {
        estado: data.estado,
        observaciones_tecnicas: data.observaciones_tecnicas,
      },
      include: {
        muestra: {
          include: {
            paciente: {
              select: {
                codigo_usuario: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
        examen: true,
      },
    });

    this.logger.log(
      `Resultado actualizado: ${codigo_resultado} | Admin: ${adminId}`,
    );

    return updated;
  }

  /**
   * Obtener todos los resultados agrupados por paciente y muestra (Admin)
   * Para una vista más organizada en el panel de administración
   */
  async getAllResultadosAgrupados(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_toma = {};

      if (filters.fecha_desde) {
        where.fecha_toma.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_toma.lte = new Date(filters.fecha_hasta);
      }
    }

    // Obtener muestras con sus resultados
    const muestras = await this.prisma.muestra.findMany({
      where: {
        ...where,
        resultados: {
          some: {},
        },
      },
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
        resultados: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
                codigo_interno: true,
              },
            },
          },
          orderBy: {
            examen: {
              nombre: 'asc',
            },
          },
        },
      },
      orderBy: {
        fecha_toma: 'desc',
      },
    });

    // Formatear la respuesta agrupada
    return muestras.map((muestra) => ({
      codigo_muestra: muestra.codigo_muestra,
      id_muestra: muestra.id_muestra,
      fecha_toma: muestra.fecha_toma,
      tipo_muestra: muestra.tipo_muestra,
      estado_muestra: muestra.estado,
      paciente: muestra.paciente,
      resultados: muestra.resultados.map((r) => ({
        codigo_resultado: r.codigo_resultado,
        examen: r.examen,
        valor_numerico: r.valor_numerico,
        valor_texto: r.valor_texto,
        unidad_medida: r.unidad_medida,
        nivel: r.nivel,
        estado: r.estado,
        fecha_resultado: r.fecha_resultado,
        url_pdf: r.url_pdf,
      })),
      total_examenes: muestra.resultados.length,
      examenes_listos: muestra.resultados.filter((r) =>
        this.estadosResultadoDisponibles.includes(r.estado),
      ).length,
      examenes_pendientes: muestra.resultados.filter(
        (r) => r.estado === 'EN_PROCESO',
      ).length,
    }));
  }

  /**
   * Obtener estadísticas de resultados (Admin)
   */
  async getEstadisticas(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const where: any = {};

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_resultado = {};

      if (filters.fecha_desde) {
        where.fecha_resultado.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        where.fecha_resultado.lte = new Date(filters.fecha_hasta);
      }
    }

    const [
      total,
      enProceso,
      listos,
      validados,
      entregados,
      fuera_rango,
      criticos,
    ] = await Promise.all([
      this.prisma.resultado.count({ where }),
      this.prisma.resultado.count({ where: { ...where, estado: 'EN_PROCESO' } }),
      this.prisma.resultado.count({ where: { ...where, estado: 'LISTO' } }),
      this.prisma.resultado.count({ where: { ...where, estado: 'VALIDADO' } }),
      this.prisma.resultado.count({ where: { ...where, estado: 'ENTREGADO' } }),
      this.prisma.resultado.count({
        where: { ...where, dentro_rango_normal: false },
      }),
      this.prisma.resultado.count({ where: { ...where, nivel: 'CRITICO' } }),
    ]);

    return {
      total,
      en_proceso: enProceso,
      listos,
      validados,
      entregados,
      fuera_rango_normal: fuera_rango,
      criticos,
    };
  }

  /**
   * Generar código de verificación único
   */
  private generarCodigoVerificacion(): string {
    const uuid = randomUUID();
    return `VER-${uuid.substring(0, 8).toUpperCase()}`;
  }

  /**
   * Enviar notificación WhatsApp al paciente cuando su resultado está listo
   * Verifica el consentimiento del usuario antes de enviar
   */
  private async enviarNotificacionWhatsApp(
    codigo_paciente: number,
    telefono: string | null,
    nombre_paciente: string,
    nombre_examen: string,
    codigo_verificacion: string,
  ): Promise<void> {
    // Verificar que el servicio de WhatsApp esté configurado
    if (!this.whatsappService.isConfigured()) {
      this.logger.debug('WhatsApp no configurado, omitiendo notificación');
      return;
    }

    // Verificar que el paciente tenga teléfono registrado
    if (!telefono) {
      this.logger.debug(
        `Paciente ${codigo_paciente} no tiene teléfono registrado, omitiendo notificación WhatsApp`,
      );
      return;
    }

    // Verificar consentimiento del usuario para notificaciones WhatsApp
    const consentimiento = await this.prisma.consentimiento.findFirst({
      where: {
        codigo_usuario: codigo_paciente,
        tipo_consentimiento: 'NOTIFICACIONES_WHATSAPP',
      },
      orderBy: {
        fecha_consentimiento: 'desc',
      },
    });

    // Si no hay consentimiento o está rechazado, no enviar
    if (!consentimiento || !consentimiento.aceptado) {
      this.logger.debug(
        `Paciente ${codigo_paciente} no tiene consentimiento para WhatsApp, omitiendo notificación`,
      );
      return;
    }

    // Formatear mensaje
    const mensaje = this.formatearMensajeResultadoListo(
      nombre_paciente,
      nombre_examen,
      codigo_verificacion,
    );

    // Enviar mensaje
    const result = await this.whatsappService.sendMessage({
      to: telefono,
      message: mensaje,
      tipo: 'GENERAL',
    });

    if (result.success) {
      this.logger.log(
        `Notificación WhatsApp enviada a paciente ${codigo_paciente} para resultado de ${nombre_examen}`,
      );
    } else {
      this.logger.warn(
        `Error enviando WhatsApp a paciente ${codigo_paciente}: ${result.error}`,
      );
    }
  }

  /**
   * Formatear mensaje de resultado listo para WhatsApp
   */
  private formatearMensajeResultadoListo(
    nombre_paciente: string,
    nombre_examen: string,
    codigo_verificacion: string,
  ): string {
    let mensaje = `🏥 *LABORATORIO CLÍNICO FRANZ*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `¡Hola ${nombre_paciente}! 👋\n\n`;
    mensaje += `✅ Tu resultado de *${nombre_examen}* ya está disponible.\n\n`;
    mensaje += `📋 Código de verificación:\n`;
    mensaje += `*${codigo_verificacion}*\n\n`;
    mensaje += `📱 Puedes descargarlo desde:\n`;
    mensaje += `Portal del Paciente > Mis Resultados\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `_Este mensaje es automático. Por favor no responder._`;

    return mensaje;
  }

  /**
   * Descuenta insumos del inventario al validar un resultado.
   * Política: si no hay stock suficiente, se valida igual con warning (no bloquea).
   * Usa el servicio completo de inventario: FIFO de lotes, manejo de reactivos, alertas.
   */
  private async descontarInsumosAutomatico(
    codigo_examen: number,
    referencia_id: number,
    userId: number,
  ): Promise<void> {
    try {
      const resultado = await this.inventarioService.descontarInsumosExamen(
        codigo_examen,
        referencia_id,
        userId,
      );

      if (resultado.success && resultado.movimientos.length > 0) {
        this.logger.log(
          `Insumos descontados para resultado #${referencia_id}: ${resultado.mensaje}`,
        );
        this.adminEventsService.emitResultadoInsumosDeducted(referencia_id, userId, {
          movimientos: resultado.movimientos.length,
          mensaje: resultado.mensaje,
          alertas_reactivos: resultado.alertas_reactivos,
        });
      }

      if (resultado.alertas_reactivos?.length > 0) {
        this.logger.warn(
          `Alertas de reactivos tras resultado #${referencia_id}: ${resultado.alertas_reactivos.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `No se pudieron descontar insumos para resultado #${referencia_id}: ${error.message}`,
      );
      this.adminEventsService.emitResultadoInsumosFailed(referencia_id, userId, {
        error: error.message,
      });
    }
  }
}
